import { Router, type Router as ExpressRouter } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ChatService } from '../../application/chat/ChatService'
import { benchmarkFeatureSchema } from '../../application/benchmark/types'
import { ValidationError } from '../../domain/errors'
import { GeminiModelProvider } from '../../infrastructure/ai/geminiProvider'
import { SupabaseKnowledgeRetriever } from '../../infrastructure/retrieval/supabaseKnowledgeRetriever'

export const chatRouter: ExpressRouter = Router()

function createChatService(): ChatService {
  return new ChatService({
    provider: new GeminiModelProvider(),
    knowledgeRetriever: new SupabaseKnowledgeRetriever(),
  })
}

const chatMessageSchema = z.object({
  feature: benchmarkFeatureSchema,
  userInput: z.string().min(1),
  fileContext: z.string().optional(),
})

chatRouter.post('/message', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = chatMessageSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new ValidationError('Invalid request payload')
    }

    const { feature, userInput, fileContext } = parsed.data
    const response = await createChatService().generateResponse(feature, userInput, fileContext)

    res.json(response)
  } catch (error) {
    next(error)
  }
})
