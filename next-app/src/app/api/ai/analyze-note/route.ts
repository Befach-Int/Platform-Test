/**
 * AI Note Analysis API
 *
 * Analyzes placeholder notes and suggests conversion to work items
 * Uses Claude Haiku via OpenRouter for fast, cost-effective analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'anthropic/claude-3-haiku-20240307'

interface AnalyzeNoteRequest {
  noteContent: string
  workspaceContext?: {
    existingTypes: string[]
    existingTags: string[]
  }
}

interface SuggestedWorkItem {
  type: 'idea' | 'epic' | 'feature' | 'user_story' | 'task' | 'bug'
  name: string
  purpose: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  tags: string[]
  acceptanceCriteria: string[]
  estimatedHours?: number
  confidence: number // 0-100
  reasoning: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate OpenRouter API key
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const body: AnalyzeNoteRequest = await request.json()
    const { noteContent, workspaceContext } = body

    if (!noteContent || noteContent.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    // Build context prompt
    const contextPrompt = workspaceContext
      ? `
Existing work item types in workspace: ${workspaceContext.existingTypes.join(', ')}
Existing tags in workspace: ${workspaceContext.existingTags.join(', ')}
`
      : ''

    // Call OpenRouter API with Claude Haiku
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Product Lifecycle Management Platform',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that analyzes placeholder notes and suggests how to convert them into proper work items.

Work item types:
- idea: High-level concept or brainstorming note
- epic: Large body of work spanning multiple features
- feature: User-facing functionality
- user_story: Specific user need or requirement
- task: Technical implementation work
- bug: Issue or defect to fix

Priorities: critical, high, medium, low

Analyze the note and suggest the best work item type, a concise name, purpose, priority, relevant tags, and acceptance criteria.
${contextPrompt}

IMPORTANT: Respond ONLY with valid JSON matching this schema:
{
  "type": "idea" | "epic" | "feature" | "user_story" | "task" | "bug",
  "name": "string (concise, 3-8 words)",
  "purpose": "string (1-2 sentences explaining why this matters)",
  "priority": "critical" | "high" | "medium" | "low",
  "tags": ["string"],
  "acceptanceCriteria": ["string"],
  "estimatedHours": number (optional, only if you can infer),
  "confidence": number (0-100, how confident you are in this classification),
  "reasoning": "string (brief explanation of why you chose this type/priority)"
}`,
          },
          {
            role: 'user',
            content: `Analyze this note and suggest how to convert it to a work item:\n\n${noteContent}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[AI Note Analysis] OpenRouter error:', errorData)
      return NextResponse.json(
        { error: 'Failed to analyze note with AI' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    // Parse AI response (it should be JSON)
    let suggestion: SuggestedWorkItem
    try {
      suggestion = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('[AI Note Analysis] Failed to parse AI response:', aiResponse)
      return NextResponse.json(
        { error: 'Invalid AI response format', rawResponse: aiResponse },
        { status: 500 }
      )
    }

    // Validate suggestion
    const validTypes = ['idea', 'epic', 'feature', 'user_story', 'task', 'bug']
    const validPriorities = ['critical', 'high', 'medium', 'low']

    if (!validTypes.includes(suggestion.type)) {
      suggestion.type = 'task' // Default fallback
    }

    if (!validPriorities.includes(suggestion.priority)) {
      suggestion.priority = 'medium' // Default fallback
    }

    // Ensure confidence is in valid range
    suggestion.confidence = Math.max(0, Math.min(100, suggestion.confidence || 50))

    return NextResponse.json({
      success: true,
      suggestion,
      model: MODEL,
    })
  } catch (error) {
    console.error('[AI Note Analysis] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
