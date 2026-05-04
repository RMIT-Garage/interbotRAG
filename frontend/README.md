## Internbot Frontend

The frontend is a Next.js App Router application for Internbot's landing page, auth flow, dashboard, and AI demo experiences.

### Development

```bash
pnpm --filter frontend dev
```

Open [http://localhost:3000](http://localhost:3000).

### Key folders

- `src/app`: route groups and pages
- `src/components`: layout, shared, and demo UI
- `src/providers`: client-side providers (auth, toasts)
- `public`: branding assets (logo and favicon)

### Design system

Design tokens and UI conventions are documented in [`docs/DESIGN.md`](../docs/DESIGN.md).  
Brand defaults come from `NEXT_PUBLIC_APP_NAME` with `Internbot` as fallback.

### Build

```bash
pnpm --filter frontend build
```
