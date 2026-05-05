import type { Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import { getOpenApiDocument } from './generator'

export function mountOpenApiDocs(app: Express): void {
  app.get('/api/openapi.json', (_req, res) => {
    res.json(getOpenApiDocument())
  })

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        url: '/api/openapi.json',
      },
    }),
  )
}
