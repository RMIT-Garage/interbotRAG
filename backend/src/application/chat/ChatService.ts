import type { BenchmarkFeature } from '../benchmark/types'
import type { KnowledgeRetriever, RetrievedKnowledgeChunk } from '../ports/knowledgeRetriever'
import type { ModelProvider } from '../ports/modelProvider'
import { getPromptMaterial } from '../prompts/registry'

interface ChatServiceOptions {
  provider: ModelProvider
  knowledgeRetriever: KnowledgeRetriever
}

export interface ChatResponse {
  reply: string
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

    return {
      reply: response.rawText,
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
