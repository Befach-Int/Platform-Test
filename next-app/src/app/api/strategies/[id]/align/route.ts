/**
 * Strategy Alignment API Routes
 *
 * Manage work item to strategy alignments
 *
 * POST   /api/strategies/[id]/align - Align work item to strategy
 * DELETE /api/strategies/[id]/align - Remove alignment
 *
 * Security: Team-based RLS with team membership validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  AlignWorkItemRequest,
  RemoveAlignmentRequest,
} from '@/lib/types/strategy'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * POST /api/strategies/[id]/align
 *
 * Align a work item to this strategy.
 * If is_primary is true, sets work_items.strategy_id
 * Otherwise, creates entry in work_item_strategies junction table
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: strategyId } = await params
    const supabase = await createClient()
    const body: AlignWorkItemRequest = await req.json()

    const {
      work_item_id,
      alignment_strength = 'medium',
      notes,
      is_primary = false,
    } = body

    if (!work_item_id) {
      return NextResponse.json(
        { error: 'work_item_id is required' },
        { status: 400 }
      )
    }

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('product_strategies')
      .select('team_id, workspace_id')
      .eq('id', strategyId)
      .single()

    if (strategyError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 })
    }

    // Fetch work item
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .select('team_id, workspace_id')
      .eq('id', work_item_id)
      .single()

    if (workItemError || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // Validate both are in the same team
    if (strategy.team_id !== workItem.team_id) {
      return NextResponse.json(
        { error: 'Strategy and work item must be in the same team' },
        { status: 400 }
      )
    }

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', strategy.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    if (is_primary) {
      // Set primary alignment on work_items.strategy_id
      const { error: updateError } = await supabase
        .from('work_items')
        .update({ strategy_id: strategyId })
        .eq('id', work_item_id)

      if (updateError) {
        console.error('Error setting primary alignment:', updateError)
        return NextResponse.json(
          { error: 'Failed to set primary alignment' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Primary alignment set',
        alignment_type: 'primary',
      })
    } else {
      // Create additional alignment in junction table
      const alignmentId = Date.now().toString()

      const { data: alignment, error: insertError } = await supabase
        .from('work_item_strategies')
        .upsert({
          id: alignmentId,
          work_item_id,
          strategy_id: strategyId,
          alignment_strength,
          notes: notes || null,
        }, {
          onConflict: 'work_item_id,strategy_id',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating alignment:', insertError)
        return NextResponse.json(
          { error: 'Failed to create alignment' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Additional alignment created',
        alignment_type: 'additional',
        data: alignment,
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Strategy align POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/strategies/[id]/align
 *
 * Remove work item alignment from this strategy.
 * Body: { work_item_id, remove_primary? }
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: strategyId } = await params
    const supabase = await createClient()
    const body: RemoveAlignmentRequest = await req.json()

    const { work_item_id, remove_primary = false } = body

    if (!work_item_id) {
      return NextResponse.json(
        { error: 'work_item_id is required' },
        { status: 400 }
      )
    }

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch strategy to get team_id
    const { data: strategy, error: strategyError } = await supabase
      .from('product_strategies')
      .select('team_id')
      .eq('id', strategyId)
      .single()

    if (strategyError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 })
    }

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', strategy.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    const results: { primary_removed: boolean; additional_removed: boolean } = {
      primary_removed: false,
      additional_removed: false,
    }

    // Remove primary alignment if requested
    if (remove_primary) {
      const { data: workItem } = await supabase
        .from('work_items')
        .select('strategy_id')
        .eq('id', work_item_id)
        .single()

      if (workItem?.strategy_id === strategyId) {
        const { error: updateError } = await supabase
          .from('work_items')
          .update({ strategy_id: null })
          .eq('id', work_item_id)

        if (updateError) {
          console.error('Error removing primary alignment:', updateError)
        } else {
          results.primary_removed = true
        }
      }
    }

    // Remove additional alignment from junction table
    const { error: deleteError } = await supabase
      .from('work_item_strategies')
      .delete()
      .eq('work_item_id', work_item_id)
      .eq('strategy_id', strategyId)

    if (!deleteError) {
      results.additional_removed = true
    }

    if (!results.primary_removed && !results.additional_removed) {
      return NextResponse.json(
        { error: 'No alignment found to remove' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Strategy align DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
