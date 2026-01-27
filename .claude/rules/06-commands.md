# Commands & Skills

## MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase** | Migrations, queries, RLS, types |
| **shadcn/ui** | Component installation |
| **Context7** | Library documentation lookup |

## Skills (Auto-Invoke)

| Skill | Trigger |
|-------|---------|
| `parallel-ai` | ALL web search/extraction (MANDATORY) |
| `webapp-testing` | Playwright testing |
| `frontend-design` | Production UI building |
| `document-skills` | xlsx/pdf/docx export |

**NEVER use WebFetch/WebSearch directly** - use parallel-ai skill.

## Slash Commands

### MAKER Workflow
| Phase | Command | Purpose |
|-------|---------|---------|
| 1 | `/status-check` | Read PROGRESS.md, select task |
| 2 | `/research-plan` | Research, plan, CREATE BRANCH |
| 3 | `/parallel-dev` | Implement with parallel agents |
| 4 | `/quality-review` | Type check, code review |
| 5 | `/test` | Run E2E tests |
| 6 | `/deploy` | Create PR (NO auto-merge) |
| 7 | `/merge` | Squash-merge after approval |

### Operational
| Command | Purpose |
|---------|---------|
| `/db-migration` | RLS + team_id template |
| `/security-review` | OWASP Top 10 check |
| `/tdd-feature` | Red-green-refactor |

## Quick Reference

```bash
# Dev server
cd next-app && bun run dev

# Build
bun run build && bun run lint

# Test
bun run test:e2e

# shadcn/ui
bunx shadcn-ui@latest add [component]
```
