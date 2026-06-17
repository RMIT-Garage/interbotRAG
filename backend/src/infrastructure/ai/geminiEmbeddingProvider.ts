import { UpstreamServiceError, ValidationError } from '../../domain/errors'
import type { EmbeddingProvider } from '../../application/ports/embeddingProvider'

interface GeminiEmbeddingProviderOptions {
  apiKey?: string
  model?: string
  endpoint?: string
  outputDimensionality?: number
  maxRetries?: number
  baseRetryDelayMs?: number
  maxRetryDelayMs?: number
}

interface GeminiEmbeddingResponse {
  embedding?: {
    values?: number[]
  }
}

const DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_MODEL = 'gemini-embedding-001'
const DEFAULT_MAX_RETRIES = 4
const DEFAULT_BASE_RETRY_DELAY_MS = 1500
const DEFAULT_MAX_RETRY_DELAY_MS = 60000

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string
  private readonly model: string
  private readonly endpoint: string
  private readonly outputDimensionality?: number
  private readonly maxRetries: number
  private readonly baseRetryDelayMs: number
  private readonly maxRetryDelayMs: number

  constructor(options: GeminiEmbeddingProviderOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.GEMINI_API_KEY ?? ''
    this.model = options.model ?? process.env.GEMINI_EMBEDDING_MODEL ?? DEFAULT_MODEL
    this.endpoint = options.endpoint ?? process.env.GEMINI_ENDPOINT ?? DEFAULT_ENDPOINT
    this.outputDimensionality = parseOutputDimensionality(
      options.outputDimensionality ?? process.env.GEMINI_EMBEDDING_DIMENSION,
    )
    this.maxRetries =
      options.maxRetries ??
      parseNumber(process.env.GEMINI_RETRY_MAX_ATTEMPTS, DEFAULT_MAX_RETRIES)
    this.baseRetryDelayMs =
      options.baseRetryDelayMs ??
      parseNumber(process.env.GEMINI_RETRY_BASE_DELAY_MS, DEFAULT_BASE_RETRY_DELAY_MS)
    this.maxRetryDelayMs =
      options.maxRetryDelayMs ??
      parseNumber(process.env.GEMINI_RETRY_MAX_DELAY_MS, DEFAULT_MAX_RETRY_DELAY_MS)

    if (!this.apiKey) {
      throw new ValidationError('GEMINI_API_KEY is required for embeddings')
    }
  }

  async embed(text: string): Promise<number[]> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const response = await fetch(
        `${this.endpoint}/models/${encodeURIComponent(this.model)}:embedContent?key=${encodeURIComponent(this.apiKey)}`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            content: {
              parts: [{ text }],
            },
            ...(this.outputDimensionality ? { outputDimensionality: this.outputDimensionality } : {}),
          }),
        },
      )

      if (!response.ok) {
        const errText = await response.text()
        const canRetry = attempt < this.maxRetries && isRetryableStatus(response.status)

        if (!canRetry) {
          throw new UpstreamServiceError(`Gemini embedding request failed (${response.status}): ${errText}`)
        }

        const retryDelayMs =
          extractRetryDelayMs(errText) ??
          getBackoffDelayMs(attempt, this.baseRetryDelayMs, this.maxRetryDelayMs)

        await sleep(retryDelayMs)
        continue
      }

      const payload = (await response.json()) as GeminiEmbeddingResponse
      const values = payload.embedding?.values

      if (!values || values.length === 0) {
        throw new ValidationError('Gemini embedding response was empty')
      }

      return values
    }

    throw new UpstreamServiceError('Gemini embedding request retries exhausted')
  }
}

function parseOutputDimensionality(value: number | string | undefined): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback
  }

  return parsed
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

function extractRetryDelayMs(errorBody: string): number | undefined {
  const retryDelayMatch = errorBody.match(/"retryDelay"\s*:\s*"(\d+)s"/)
  if (retryDelayMatch?.[1]) {
    const seconds = Number(retryDelayMatch[1])
    if (!Number.isNaN(seconds)) {
      return seconds * 1000
    }
  }

  const retryInTextMatch = errorBody.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i)
  if (retryInTextMatch?.[1]) {
    const seconds = Number(retryInTextMatch[1])
    if (!Number.isNaN(seconds)) {
      return Math.ceil(seconds * 1000)
    }
  }

  return undefined
}

function getBackoffDelayMs(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponential = baseDelayMs * Math.pow(2, attempt)
  return Math.min(exponential, maxDelayMs)
}
