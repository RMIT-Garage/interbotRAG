# RAG MVP

This document describes the retrieval-augmented generation MVP implemented in this repository today.

For the lower-level system design, see [ARCHITECTURE.md](ARCHITECTURE.md). For setup and operational steps, see [RAG-SETUP-PLAYBOOK.md](RAG-SETUP-PLAYBOOK.md). For environment variable definitions, see [ENV-VARS.md](ENV-VARS.md).

## What is implemented

The current MVP provides:

- authenticated chat through `POST /api/chat/message`
- manual knowledge ingestion through `POST /api/knowledge/documents`
- knowledge document listing through `GET /api/knowledge/documents`
- admin-gated knowledge management using `actor.claims.admin === true`
- deterministic text chunking in `backend/src/application/knowledge/chunkText.ts`
- embedding generation through `backend/src/infrastructure/ai/geminiEmbeddingProvider.ts`
- Supabase `pgvector` storage and retrieval using `backend/supabase/schema.sql`
- grounded chat responses with `sources` rendered in the demo UI
- a dashboard knowledge page at `frontend/src/app/(dashboard)/knowledge/page.tsx`

## What is not implemented yet

The current MVP does **not** include:

- PDF or arbitrary file parsing for ingestion
- background sync from external systems
- n8n-based workflows
- multi-role content management UI
- advanced source ranking controls
- analytics or retrieval quality dashboards

The current ingestion path is **manual text entry** only.

## Frontend surfaces

### Demo chat
- Route: `/demo?feature=faq-rag`
- UI file: `frontend/src/components/demo/ChatInterface.tsx`
- Behavior:
  - sends an authenticated request to `/api/backend/chat/message`
  - renders assistant text plus returned source citations

### Knowledge management page
- Route: `/knowledge`
- Page file: `frontend/src/app/(dashboard)/knowledge/page.tsx`
- Behavior:
  - lists ingested knowledge documents
  - submits manual text content for ingestion
  - requires a signed-in user whose Firebase token includes `admin: true`

### Backend proxy
- Route: `/api/backend/[...path]`
- File: `frontend/src/app/api/backend/[...path]/route.ts`
- Purpose:
  - forwards frontend requests to the backend Cloud Function base URL
  - avoids emulator CORS issues
  - preserves Authorization headers

## Backend API contracts

### `POST /api/chat/message`

Handled by `backend/src/api/routes/chat.ts`.

Request body:

```json
{
  "feature": "faq-rag",
  "userInput": "Who can apply for the internship?",
  "fileContext": "optional attached text"
}
```

Notes:
- `feature` currently accepts the benchmark feature enum values.
- `fileContext` is optional and treated as supplemental context.

Response body:

```json
{
  "reply": "Students enrolled full-time are eligible...",
  "sources": [
    {
      "title": "Internship FAQ",
      "section": "Eligibility",
      "sourceUrl": "https://example.com/eligibility"
    }
  ]
}
```

### `GET /api/knowledge/documents`

Handled by `backend/src/api/routes/knowledge.ts`.

Behavior:
- requires authentication
- requires `actor.claims.admin === true`
- optionally accepts `feature` as a query parameter
- returns the currently stored documents used by the dashboard page

### `POST /api/knowledge/documents`

Handled by `backend/src/api/routes/knowledge.ts`.

Request body:

```json
{
  "feature": "faq-rag",
  "title": "Internship FAQ",
  "section": "Eligibility",
  "sourceUrl": "https://example.com/eligibility",
  "content": "Students must be enrolled full-time to apply..."
}
```

Behavior:
- requires authentication
- requires `actor.claims.admin === true`
- chunks text
- generates embeddings per chunk
- writes the document and chunks into Supabase

## Runtime flow

## 1. Knowledge ingestion

1. Admin opens `/knowledge`
2. Frontend submits the form to `/api/backend/knowledge/documents`
3. Next.js proxy forwards the request to the backend
4. Backend route validates the payload and checks the admin claim
5. `IngestKnowledgeDocument` trims and chunks the content
6. Gemini embeddings are generated for each chunk
7. Supabase stores the document row and chunk rows
8. The dashboard refreshes the document list

## 2. Chat retrieval

1. User opens `/demo?feature=faq-rag`
2. Frontend posts a chat message to `/api/backend/chat/message`
3. Backend embeds the query
4. Supabase RPC `match_knowledge_chunks` returns the top matching chunks for the selected feature
5. `ChatService` appends the retrieved chunks to the model input
6. Gemini generates the final answer
7. Backend returns `{ reply, sources }`
8. Frontend renders the reply and citations

## Data model

The source of truth is `backend/supabase/schema.sql`.

### `knowledge_documents`
Stores the canonical ingested entry.

Important columns:
- `feature`
- `title`
- `section`
- `content`
- `source_url`
- `status`
- `created_at`

### `knowledge_chunks`
Stores retrieval units derived from the source document.

Important columns:
- `document_id`
- `feature`
- `title`
- `section`
- `text`
- `chunk_index`
- `embedding`
- `source_url`
- `created_at`

### `match_knowledge_chunks`
Supabase SQL function used by the retriever.

Behavior:
- accepts the query embedding
- filters by `feature`
- orders by cosine distance
- returns title, section, text, source URL, and similarity

## Auth and authorization

All backend API routes are protected by Firebase token verification.

Knowledge management is additionally restricted to users whose decoded Firebase token contains:

```json
{ "admin": true }
```

The backend checks this claim before allowing access to the knowledge management endpoints.

## Dependencies required for full MVP behavior

The app can still boot without live retrieval, but the full MVP requires:

- Firebase auth configuration
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- the Supabase schema from `backend/supabase/schema.sql`

If the critical retrieval env vars are missing, chat safely falls back to prompt-only behavior with no retrieved sources.

## Related files

Core backend files:
- `backend/src/api/routes/chat.ts`
- `backend/src/api/routes/knowledge.ts`
- `backend/src/application/chat/ChatService.ts`
- `backend/src/application/knowledge/chunkText.ts`
- `backend/src/application/knowledge/ingestKnowledgeDocument.ts`
- `backend/src/infrastructure/retrieval/supabaseKnowledgeRepository.ts`
- `backend/src/infrastructure/retrieval/supabaseKnowledgeRetriever.ts`
- `backend/src/infrastructure/ai/geminiEmbeddingProvider.ts`
- `backend/supabase/schema.sql`

Core frontend files:
- `frontend/src/app/(dashboard)/knowledge/page.tsx`
- `frontend/src/components/demo/ChatInterface.tsx`
- `frontend/src/app/api/backend/[...path]/route.ts`
