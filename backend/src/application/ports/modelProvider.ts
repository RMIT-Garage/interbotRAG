export interface ModelUsage {
  inputTokens?: number
  outputTokens?: number
}

export interface GenerateTextRequest {
  systemPrompt: string
  userInput: string
  temperature?: number
}

export interface GenerateTextResponse {
  rawText: string
  usage?: ModelUsage
}

export interface ModelProvider {
  readonly name: string
  generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>
}
