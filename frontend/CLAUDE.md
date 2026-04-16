# Frontend — Claude Instructions

Loaded automatically when editing files in `frontend/`. Supplements root `CLAUDE.md`.

---

## Next.js 16 (App Router)

This is **Next.js 16** — APIs, file conventions, and routing differ from earlier versions.
Before writing any Next.js code, check `node_modules/next/dist/docs/` for breaking changes.

Key Next.js 16 changes from training data:
- `middleware.ts` is deprecated — use `proxy.ts` with `export function proxy()`
- App Router is the only supported router
- Server Actions are stable and the preferred mutation pattern

---

## Server vs Client Components

**Default: Server Component.** Add `'use client'` only when you need:
- React hooks (`useState`, `useEffect`, `useContext`, etc.)
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `localStorage`, `navigator`, etc.)
- Third-party client-only libraries

**Never add `'use client'` to:**
- Files that only fetch data and render HTML
- Files that only import server-only libraries
- Layout files unless they truly need client state

**Never import in a Server Component:**
- `firebase/auth`, `firebase/firestore`, `firebase/storage` (client SDK)
- `@/lib/firebase/client` (client SDK)
- Any hook from `@/hooks/` (they're all client hooks)

**For server-side Firebase always use:** `@/lib/firebase/admin`

---

## File Organization

```
src/
├── app/
│   ├── (auth)/           # Login, register — no auth required
│   ├── (dashboard)/      # Protected pages — requireAuth() in layout
│   ├── api/auth/session/ # Session cookie route handler
│   ├── layout.tsx        # Root layout — Server Component
│   └── page.tsx          # Landing page — Server Component
├── components/
│   ├── layout/           # DashboardShell, Sidebar, Navbar, PageHeader
│   ├── shared/           # ErrorBoundary, LoadingSpinner, EmptyState
│   └── ui/               # shadcn/ui (do not edit — regenerate with CLI)
├── features/             # One folder per business domain
│   └── [domain]/
│       ├── components/   # Domain-specific UI
│       ├── hooks/        # Domain-specific hooks
│       ├── actions/      # Server Actions
│       └── types.ts      # Domain types
├── lib/
│   ├── firebase/
│   │   ├── client.ts     # Client SDK singleton (browser only)
│   │   ├── admin.ts      # Admin SDK (server-only, never client)
│   │   ├── auth.ts       # Sign-in helpers
│   │   ├── firestore.ts  # typedCollection<T>() factory
│   │   └── storage.ts    # Upload helpers
│   ├── validations/      # Zod schemas for forms and actions
│   └── utils.ts          # cn(), formatDate(), truncate()
├── hooks/                # Cross-domain React hooks (all 'use client')
├── providers/            # AuthProvider, Toaster (all 'use client')
├── actions/              # Cross-domain Server Actions
└── types/                # Shared TypeScript types
```

**Import rules:**
- Always use `@/` alias — never `../../` more than one level
- Features import from `@/lib/`, `@/hooks/`, `@/types/` but not from other features
- `app/` pages import from `@/components/`, `@/features/`, `@/actions/`

---

## Server Actions

All Server Actions live in `src/features/[domain]/actions/` or `src/actions/` for cross-domain.

```typescript
'use server'

import { requireAuth } from '@/actions/auth.actions'
import type { ActionResult } from '@/types'

export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<void>> {
  const session = await requireAuth() // redirects to /login if not authed

  // validate input with zod
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  try {
    await adminDb.collection('users').doc(session.uid).update(parsed.data)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update profile' }
  }
}
```

- Always return `ActionResult<T>`: `{ success: boolean, error?: string, data?: T }`
- Always call `requireAuth()` first
- Always validate with Zod before any database operation
- Never throw from a Server Action — return `{ success: false, error: '...' }`

---

## Auth Flow

1. User signs in via `@/lib/firebase/auth` (client SDK)
2. Client calls `POST /api/auth/session` with the Firebase ID token
3. Server creates an HttpOnly `__session` cookie (Firebase session cookie)
4. `proxy.ts` checks for the `__session` cookie to gate protected routes
5. Server Actions call `requireAuth()` which calls `adminAuth.verifySessionCookie()`
6. **Critical:** The cookie check in proxy.ts is optimistic (presence only). Real verification always happens in Server Actions near the data.

---

## Design System

See `docs/DESIGN.md` for the full design reference:
- Tailwind v4 CSS-first config, `@theme` tokens
- Color system, typography scale, spacing
- Button, input, card, badge patterns
- Loading/error/empty state patterns
- Icon sizing conventions (lucide-react)
- Form pattern (react-hook-form + zod + sonner)

---

## Testing

Tests live in `frontend/tests/unit/` mirroring `src/`.

- `vi.mock('@/lib/firebase/client')` in setup
- `vi.mock('@/lib/firebase/admin')` in setup
- Use `@testing-library/react` for components, `renderHook` for hooks
- Do not test `src/components/ui/` (shadcn) or `src/app/` pages
