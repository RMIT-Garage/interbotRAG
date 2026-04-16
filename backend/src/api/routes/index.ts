import { Router, type Router as ExpressRouter } from 'express'
import { benchmarksRouter } from './benchmarks'

const router: ExpressRouter = Router()

router.use('/benchmarks', benchmarksRouter)

export { router as apiRouter }
