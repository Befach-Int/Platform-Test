# API Routes

**Scope**: All `/api/*` endpoints

## PATTERN

```typescript
// route.ts template
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // ALWAYS filter by team_id
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('team_id', teamId)
  
  if (error) throw error
  return NextResponse.json({ data })
}
```

## CRITICAL RULES

- **ALWAYS** filter queries by `team_id`
- **ALWAYS** check auth: `supabase.auth.getUser()`
- **NEVER** return raw Supabase errors to client
- Use `NextResponse.json()` for responses

## ROUTES

| Route | Purpose |
|-------|---------|
| `/api/work-items` | CRUD work items |
| `/api/workspaces` | Workspace management |
| `/api/team/*` | Team, members, invites |
| `/api/ai/*` | AI chat, suggestions |
| `/api/resources` | Resource linking |

## ERROR HANDLING

```typescript
try {
  // operation
} catch (error) {
  console.error('Context:', error)
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  )
}
```
