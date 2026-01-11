import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Workspace API] Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again', details: authError?.message },
        { status: 401 }
      )
    }

    console.log('[Workspace API] Authenticated user:', user.id, user.email)

    // 2. Parse request body
    const body = await request.json()
    const { team_id, name, description, mode = 'development' } = body

    if (!team_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: team_id and name are required' },
        { status: 400 }
      )
    }

    console.log('[Workspace API] Creating workspace:', { team_id, name, mode })

    // 3. Verify user is a member of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      console.error('[Workspace API] Team membership check failed:', membershipError)
      return NextResponse.json(
        {
          error: 'You are not a member of this team',
          details: membershipError?.message,
          team_id,
          user_id: user.id,
        },
        { status: 403 }
      )
    }

    console.log('[Workspace API] User is team member with role:', membership.role)

    // 4. Create workspace
    const workspaceId = `workspace_${Date.now()}`
    const now = new Date().toISOString()

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        id: workspaceId,
        team_id: team_id,
        name: name,
        description: description || null,
        mode: mode,
        mode_changed_at: now,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (workspaceError) {
      console.error('[Workspace API] Workspace creation failed:', workspaceError)
      return NextResponse.json(
        {
          error: 'Failed to create workspace',
          details: workspaceError.message,
          code: workspaceError.code,
          hint: workspaceError.hint,
        },
        { status: 500 }
      )
    }

    console.log('[Workspace API] Workspace created successfully:', workspaceId)

    return NextResponse.json(
      {
        success: true,
        workspace,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Workspace API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all workspaces for teams the user is a member of
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select(
        `
        *,
        teams:team_id (
          id,
          name
        )
      `
      )
      .order('created_at', { ascending: false })

    if (workspacesError) {
      console.error('[Workspace API] Failed to fetch workspaces:', workspacesError)
      return NextResponse.json(
        { error: 'Failed to fetch workspaces', details: workspacesError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ workspaces }, { status: 200 })
  } catch (error) {
    console.error('[Workspace API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
