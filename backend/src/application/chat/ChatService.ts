import {
  checkerModelOutputSchema,
  faqModelOutputSchema,
  type BenchmarkFeature,
  type CheckerModelOutput,
  type FaqModelOutput,
} from '../benchmark/types'
import type { KnowledgeRetriever, RetrievedKnowledgeChunk } from '../ports/knowledgeRetriever'
import type { ModelProvider } from '../ports/modelProvider'
import { getPromptMaterial } from '../prompts/registry'

interface ChatServiceOptions {
  provider: ModelProvider
  knowledgeRetriever: KnowledgeRetriever
}

export type StructuredChatData =
  | { type: 'checker'; data: CheckerModelOutput }
  | { type: 'faq'; data: FaqModelOutput }

export interface ChatResponse {
  reply: string
  feature: BenchmarkFeature
  structuredData?: StructuredChatData
  contentType?: 'plain' | 'markdown' | 'structured'
  contentVersion?: 'v1'
  contentBlocks?: Array<
    | { type: 'text'; text: string }
    | { type: 'markdown'; text: string }
    | { type: 'citation'; label: string; url?: string }
  >
  sources: Array<{
    title: string
    section: string
    sourceUrl?: string
  }>
  webSources?: Array<{
    title: string
    uri: string
  }>
  debug?: {
    webSearch: {
      requested: boolean
      attempted: boolean
      used: boolean
      sourceCount: number
      fallbackTriggered: boolean
    }
  }
}

export class ChatService {
  private readonly provider: ModelProvider
  private readonly knowledgeRetriever: KnowledgeRetriever

  constructor(options: ChatServiceOptions) {
    this.provider = options.provider
    this.knowledgeRetriever = options.knowledgeRetriever
  }

  async generateResponse(
    feature: BenchmarkFeature,
    userInput: string,
    fileContext?: string,
    useWebSearch = false,
  ): Promise<ChatResponse> {
    const promptMaterial = getPromptMaterial(feature)
    const retrievalQuery = buildRetrievalQuery(userInput, fileContext)
    const retrievedChunks = await this.knowledgeRetriever.search(feature, retrievalQuery)

    let fullInput = userInput
    if (retrievedChunks.length > 0) {
      fullInput += `\n\n[RETRIEVED KNOWLEDGE]\n${formatRetrievedChunks(retrievedChunks)}`
    }

    if (fileContext) {
      fullInput += `\n\n[ATTACHED FILE CONTEXT]\n${fileContext}`
    }

    const response = await this.provider.generateText({
      systemPrompt: promptMaterial.content,
      userInput: fullInput,
      temperature: resolveTemperature(feature),
      enableGoogleSearch: feature === 'faq-rag' && useWebSearch,
    })

    const structuredData = parseStructuredResponse(feature, response.rawText)
    const hasFallbackReply = response.rawText.includes(FAQ_FALLBACK_REPLY)
    const webSources = hasFallbackReply ? undefined : response.webSources
    const webSearchAttempted = feature === 'faq-rag' && useWebSearch
    const webSourceCount = webSources?.length ?? 0
    const shouldHideRetrievedSources =
      (structuredData?.type === 'faq' && structuredData.data.answered_from_context === false) ||
      (feature === 'faq-rag' && hasFallbackReply)
    const contentType = resolveContentType(structuredData, response.rawText)
    const contentBlocks =
      contentType === 'structured'
        ? undefined
        : [
            {
              type: contentType === 'markdown' ? 'markdown' : 'text',
              text: response.rawText,
            } as const,
          ]

    return {
      reply: response.rawText,
      feature,
      structuredData,
      contentType,
      contentVersion: 'v1',
      contentBlocks,
      sources: shouldHideRetrievedSources
        ? []
        : retrievedChunks.map((chunk) => ({
            title: chunk.title,
            section: chunk.section,
            sourceUrl: chunk.sourceUrl,
          })),
      webSources,
      debug: {
        webSearch: {
          requested: useWebSearch,
          attempted: webSearchAttempted,
          used: webSourceCount > 0,
          sourceCount: webSourceCount,
          fallbackTriggered: hasFallbackReply,
        },
      },
    }
  }
}

const MAX_ATTACHMENT_RETRIEVAL_CHARS = 2500
const FAQ_FALLBACK_REPLY =
  "I don't have enough information to answer that from the available policy documents. Please contact your course coordinator directly for guidance."

function buildRetrievalQuery(userInput: string, fileContext?: string): string {
  if (!fileContext) {
    return userInput
  }

  const normalized = fileContext.trim()
  if (!normalized) {
    return userInput
  }

  const truncated =
    normalized.length > MAX_ATTACHMENT_RETRIEVAL_CHARS
      ? `${normalized.slice(0, MAX_ATTACHMENT_RETRIEVAL_CHARS)}…`
      : normalized

  return `${userInput}\n\n[ATTACHMENT_SNIPPET]\n${truncated}`
}

function resolveTemperature(feature: BenchmarkFeature): number {
  return feature === 'faq-rag' ? 0.35 : 0.1
}

function resolveContentType(structuredData: StructuredChatData | undefined, rawText: string): 'plain' | 'markdown' | 'structured' {
  if (structuredData) {
    return 'structured'
  }

  const hasMarkdownSignals = /(^|\n)\s{0,3}#{1,6}\s|\*\*|(^|\n)\s*[-*]\s|\[[^\]]+\]\([^)]+\)|```/m.test(rawText)
  return hasMarkdownSignals ? 'markdown' : 'plain'
}

function formatRetrievedChunks(chunks: RetrievedKnowledgeChunk[]): string {
  return chunks
    .map((chunk, index) => {
      const source = chunk.sourceUrl ? `\nSource: ${chunk.sourceUrl}` : ''
      return `[${index + 1}] ${chunk.title} — ${chunk.section}${source}\n${chunk.text}`
    })
    .join('\n\n')
}

/**
 * Scan backwards from the last '}' to find its matching '{', then attempt
 * to parse the slice as JSON. This reliably extracts a JSON object that
 * appears at the end of a model response that may contain reasoning text
 * or markdown bullet points before the JSON block.
 */
function extractJsonFromText(text: string): unknown | null {
  const lastBrace = text.lastIndexOf('}')
  if (lastBrace === -1) return null

  let depth = 0
  for (let i = lastBrace; i >= 0; i--) {
    if (text[i] === '}') depth++
    else if (text[i] === '{') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(i, lastBrace + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

function parseStructuredResponse(feature: BenchmarkFeature, rawText: string): StructuredChatData | undefined {
  const parsed = extractJsonFromText(rawText)
  if (!parsed || typeof parsed !== 'object') return undefined

  if (feature === 'contract-checker' || feature === 'job-checker') {
    const normalized = normalizeCheckerOutput(parsed)
    const result = checkerModelOutputSchema.safeParse(normalized)
    if (result.success) return { type: 'checker', data: result.data }
  } else if (feature === 'faq-rag') {
    const result = faqModelOutputSchema.safeParse(parsed)
    if (result.success) return { type: 'faq', data: result.data }
  }

  return undefined
}

function normalizeCheckerOutput(parsed: object): object {
  const asRecord = parsed as Record<string, unknown>
  const scratchpad = asRecord.scratchpad

  if (Array.isArray(scratchpad)) {
    return {
      ...asRecord,
      scratchpad: scratchpad
        .map((line) => (typeof line === 'string' ? line : JSON.stringify(line)))
        .join('\n'),
    }
  }

  return asRecord
}
