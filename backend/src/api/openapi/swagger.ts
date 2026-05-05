import type { Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import { getOpenApiDocument } from './generator'

export function mountOpenApiDocs(app: Express): void {
  app.get('/openapi.json', (_req, res) => {
    res.json(getOpenApiDocument())
  })
  app.get('/api/openapi.json', (_req, res) => {
    res.json(getOpenApiDocument())
  })

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        // Relative URL keeps it working behind prefixed function paths,
        // e.g. /api/docs -> /api/openapi.json and /api/api/docs -> /api/api/openapi.json
        url: 'openapi.json',
      },
    }),
  )
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        url: 'openapi.json',
      },
    }),
  )
}
