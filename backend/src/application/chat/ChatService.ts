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
  sources: Array<{
    title: string
    section: string
    sourceUrl?: string
  }>
}

export class ChatService {
  private readonly provider: ModelProvider
  private readonly knowledgeRetriever: KnowledgeRetriever

  constructor(options: ChatServiceOptions) {
    this.provider = options.provider
    this.knowledgeRetriever = options.knowledgeRetriever
  }

  async generateResponse(feature: BenchmarkFeature, userInput: string, fileContext?: string): Promise<ChatResponse> {
    const promptMaterial = getPromptMaterial(feature)
    const retrievedChunks = await this.knowledgeRetriever.search(feature, userInput)

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
      temperature: 0.1,
    })

    const structuredData = parseStructuredResponse(feature, response.rawText)

    return {
      reply: response.rawText,
      feature,
      structuredData,
      sources: retrievedChunks.map((chunk) => ({
        title: chunk.title,
        section: chunk.section,
        sourceUrl: chunk.sourceUrl,
      })),
    }
  }
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
    const result = checkerModelOutputSchema.safeParse(parsed)
    if (result.success) return { type: 'checker', data: result.data }
  } else if (feature === 'faq-rag') {
    const result = faqModelOutputSchema.safeParse(parsed)
    if (result.success) return { type: 'faq', data: result.data }
  }

  return undefined
}
