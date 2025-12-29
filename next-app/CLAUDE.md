# Next.js Application

**Scope**: UI, API routes, hooks, state management

## STRUCTURE

```
src/
├── app/              # App Router
│   ├── (auth)/       # Login, signup, onboarding
│   ├── (dashboard)/  # Protected pages
│   ├── (public)/     # Public pages
│   └── api/          # API routes
├── components/       # React components
├── hooks/            # Custom hooks (use-*.ts)
├── lib/              # Utils, types, algorithms
└── providers/        # Context providers
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add page | `src/app/(dashboard)/` |
| Add API | `src/app/api/[resource]/route.ts` |
| Add component | `src/components/[feature]/` |
| Add hook | `src/hooks/use-[name].ts` |
| Add types | `src/lib/types/` (extend existing) |

## CONVENTIONS

- Route groups: `(auth)`, `(dashboard)`, `(public)`
- Hooks: prefix with `use-`
- Types: extend existing files in `lib/types/`
- UI: `components/ui/` is shadcn - never modify

## ANTI-PATTERNS

- Creating new type files → extend existing
- Modifying `ui/` components → create wrapper
- Importing from `@/app/api/` in client code

## COMMANDS

```bash
npm run dev           # localhost:3000
npm run build         # Production
npm run test:e2e      # Playwright
```
