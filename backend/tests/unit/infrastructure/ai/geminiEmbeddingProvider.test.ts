import { afterEach, describe, expect, it, vi } from 'vitest'
import { GeminiEmbeddingProvider } from '../../../../src/infrastructure/ai/geminiEmbeddingProvider'
import { UpstreamServiceError } from '../../../../src/domain/errors'

function okResponse(values: number[]): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ embedding: { values } }),
    text: async () => '',
  } as unknown as Response
}

function errorResponse(status: number, body = 'error'): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => body,
  } as unknown as Response
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GeminiEmbeddingProvider', () => {
  it('retries on a retryable 503 and then succeeds', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(errorResponse(503, 'service unavailable'))
      .mockResolvedValueOnce(okResponse([0.1, 0.2, 0.3]))
    vi.stubGlobal('fetch', fetchMock)

    const provider = new GeminiEmbeddingProvider({
      apiKey: 'test-key',
      baseRetryDelayMs: 0,
      maxRetryDelayMs: 0,
    })

    const result = await provider.embed('hello')

    expect(result).toEqual([0.1, 0.2, 0.3])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws UpstreamServiceError after exhausting retries', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(errorResponse(503))
    vi.stubGlobal('fetch', fetchMock)

    const provider = new GeminiEmbeddingProvider({
      apiKey: 'test-key',
      maxRetries: 2,
      baseRetryDelayMs: 0,
      maxRetryDelayMs: 0,
    })

    await expect(provider.embed('hello')).rejects.toBeInstanceOf(UpstreamServiceError)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('does not retry a non-retryable 400', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(errorResponse(400, 'bad request'))
    vi.stubGlobal('fetch', fetchMock)

    const provider = new GeminiEmbeddingProvider({
      apiKey: 'test-key',
      baseRetryDelayMs: 0,
      maxRetryDelayMs: 0,
    })

    await expect(provider.embed('hello')).rejects.toBeInstanceOf(UpstreamServiceError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('sends outputDimensionality when configured', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(okResponse([1, 2, 3]))
    vi.stubGlobal('fetch', fetchMock)

    const provider = new GeminiEmbeddingProvider({
      apiKey: 'test-key',
      outputDimensionality: 768,
    })

    await provider.embed('hello')

    const [, init] = fetchMock.mock.calls[0]!
    const body = JSON.parse(init!.body as string)
    expect(body.outputDimensionality).toBe(768)
  })
})
