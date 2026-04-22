# RAG Setup Playbook

This playbook walks through the minimum setup needed to make the current Firebase + Supabase RAG MVP work end-to-end.

For the feature overview, see [RAG-MVP.md](RAG-MVP.md). For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md). For canonical variable definitions, see [ENV-VARS.md](ENV-VARS.md).

## Prerequisites

You need:

- a Firebase project for auth/backend hosting
- a Supabase project with `pgvector` support
- a Gemini API key
- local project dependencies installed with `pnpm install`

## 1. Configure environment variables

Set the Firebase and frontend variables described in [ENV-VARS.md](ENV-VARS.md).

For the live RAG MVP, the backend also needs:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- optional `GEMINI_EMBEDDING_MODEL`

Minimum backend `.env` example:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_EMBEDDING_MODEL=text-embedding-004
```

Without these, the app may still start, but retrieval and ingestion will not work end-to-end.

## 2. Apply the Supabase schema

Apply `backend/supabase/schema.sql` to your Supabase project.

This creates:
- `knowledge_documents`
- `knowledge_chunks`
- the vector index for embeddings
- the `match_knowledge_chunks` RPC function used by the backend retriever

Until this SQL is applied, ingestion and retrieval requests will fail or return no useful data.

## 3. Ensure a Firebase user has the admin claim

Knowledge management is restricted to users whose Firebase token contains:

```json
{ "admin": true }
```

Set this claim for the user who will access `/knowledge`.

The exact method depends on how you manage Firebase Admin access in your environment. The important part is that the signed-in user’s decoded token includes `admin: true`.

## 4. Start the app locally

Use the project’s standard commands:

```bash
pnpm install
pnpm run dev
```

If you are using emulators, follow the existing local setup in the project README.

## 5. Sign in and open the knowledge page

1. Sign in through the app
2. Navigate to `/knowledge`
3. Confirm the page loads successfully

If you get a 403 response from the knowledge API, the admin claim is missing or not reflected in the current token.

## 6. Seed the first knowledge document

Use the form on `/knowledge` and submit a small manual record.

Suggested first seed:

- Feature: `faq-rag`
- Title: `Internship FAQ`
- Section: `Eligibility`
- Source URL: optional
- Content: a few sentences that answer a likely user question

What should happen:
- the frontend posts to `/api/backend/knowledge/documents`
- the backend validates the payload
- the backend chunks the text and generates embeddings
- the document appears in the list on the page

## 7. Verify retrieval in chat

1. Open `/demo?feature=faq-rag`
2. Ask a question directly answerable from the seeded content
3. Confirm the response includes:
   - a grounded answer
   - a `Sources` section in the chat UI

If the answer appears but no sources are shown, retrieval is not being used successfully yet.

## 8. Suggested verification checklist

Use this checklist after setup:

- [ ] `/knowledge` loads for the admin user
- [ ] `POST /api/knowledge/documents` returns success
- [ ] the knowledge document list refreshes with the new entry
- [ ] `/demo?feature=faq-rag` returns an answer
- [ ] the chat response shows at least one source
- [ ] an unrelated question does not crash the chat flow

## Troubleshooting

### Missing environment variables

Symptoms:
- ingestion fails during embedding or Supabase calls
- chat answers without sources

Checks:
- verify `SUPABASE_URL`
- verify `SUPABASE_SERVICE_ROLE_KEY`
- verify `GEMINI_API_KEY`
- verify the backend process picked up the updated env file

### No admin claim

Symptoms:
- `/knowledge` API returns 403
- document creation is blocked despite being signed in

Checks:
- confirm the Firebase user has `admin: true`
- refresh the session/token after setting the claim

### Schema not applied

Symptoms:
- Supabase calls fail
- ingestion writes fail
- retrieval returns database errors

Checks:
- verify `backend/supabase/schema.sql` was run against the correct project
- verify the `match_knowledge_chunks` function exists
- verify the `knowledge_documents` and `knowledge_chunks` tables exist

### Empty retrieval results

Symptoms:
- chat replies but `sources` is empty

Checks:
- confirm at least one `faq-rag` document was ingested
- confirm chunk rows exist in `knowledge_chunks`
- confirm embeddings were written
- confirm the question is actually related to the seeded content

### Gemini failures

Symptoms:
- ingestion fails while creating embeddings
- chat fails during generation

Checks:
- verify `GEMINI_API_KEY`
- verify the configured model names are valid for your account
- inspect backend logs for provider errors

## Useful follow-up docs

- [README.md](../README.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [ENV-VARS.md](ENV-VARS.md)
- [TESTING.md](TESTING.md)
