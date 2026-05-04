import { Router, type Router as ExpressRouter } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ChatService } from '../../application/chat/ChatService'
import { benchmarkFeatureSchema } from '../../application/benchmark/types'
import { ValidationError } from '../../domain/errors'
import { GeminiModelProvider } from '../../infrastructure/ai/geminiProvider'
import { SupabaseKnowledgeRetriever } from '../../infrastructure/retrieval/supabaseKnowledgeRetriever'

export const chatRouter: ExpressRouter = Router()

function createChatService(model?: string): ChatService {
  return new ChatService({
    provider: new GeminiModelProvider({ model }),
    knowledgeRetriever: new SupabaseKnowledgeRetriever(),
  })
}

const chatMessageSchema = z.object({
  feature: benchmarkFeatureSchema,
  userInput: z.string().min(1),
  fileContext: z.string().optional(),
  model: z.string().min(1).max(120).optional(),
})

chatRouter.post('/message', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = chatMessageSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new ValidationError('Invalid request payload')
    }

    const { feature, userInput, fileContext, model } = parsed.data
    const response = await createChatService(normalizeModelName(model)).generateResponse(
      feature,
      userInput,
      fileContext,
    )

    res.json(response)
  } catch (error) {
    next(error)
  }
})

chatRouter.get('/models', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await listGeminiGenerateModels()
    res.json({ models })
  } catch (error) {
    next(error)
  }
})

function normalizeModelName(model?: string): string | undefined {
  if (!model) return undefined
  const trimmed = model.trim()
  if (!trimmed) return undefined
  return trimmed.startsWith('models/') ? trimmed.slice('models/'.length) : trimmed
}

interface GeminiModelListResponse {
  models?: Array<{
    name?: string
    supportedGenerationMethods?: string[]
  }>
}

async function listGeminiGenerateModels(): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY
  const endpoint = process.env.GEMINI_ENDPOINT ?? 'https://generativelanguage.googleapis.com/v1beta'

  if (!apiKey) {
    throw new ValidationError('GEMINI_API_KEY is required to list chat models')
  }

  const response = await fetch(
    `${endpoint}/models?key=${encodeURIComponent(apiKey)}`,
    { method: 'GET' },
  )
  if (!response.ok) {
    throw new ValidationError(`Failed to list Gemini models (${response.status}): ${await response.text()}`)
  }

  const payload = (await response.json()) as GeminiModelListResponse
  const models = (payload.models ?? [])
    .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
    .map((model) => model.name ?? '')
    .map((name) => (name.startsWith('models/') ? name.slice('models/'.length) : name))
    .filter((name) => name.startsWith('gemini-') || name.startsWith('gemma-'))
    .sort((a, b) => a.localeCompare(b))

  return Array.from(new Set(models))
}
