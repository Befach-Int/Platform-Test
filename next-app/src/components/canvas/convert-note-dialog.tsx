'use client'

/**
 * Convert Note Dialog
 *
 * AI-powered dialog for converting placeholder notes to work items
 * Uses Claude Haiku to analyze note content and suggest work item properties
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConvertNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteContent: string
  workspaceContext?: {
    existingTypes: string[]
    existingTags: string[]
  }
  onConvert: (workItem: {
    type: string
    name: string
    purpose: string
    priority: string
    tags: string[]
    acceptanceCriteria: string[]
    estimatedHours?: number
  }) => Promise<void>
}

interface SuggestedWorkItem {
  type: 'idea' | 'epic' | 'feature' | 'user_story' | 'task' | 'bug'
  name: string
  purpose: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  tags: string[]
  acceptanceCriteria: string[]
  estimatedHours?: number
  confidence: number
  reasoning: string
}

export function ConvertNoteDialog({
  open,
  onOpenChange,
  noteContent,
  workspaceContext,
  onConvert,
}: ConvertNoteDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [suggestion, setSuggestion] = useState<SuggestedWorkItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  // Editable fields
  const [editedName, setEditedName] = useState('')
  const [editedType, setEditedType] = useState<string>('')
  const [editedPriority, setEditedPriority] = useState<string>('')

  const analyzeNote = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteContent,
          workspaceContext,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze note')
      }

      const data = await response.json()

      if (data.success && data.suggestion) {
        setSuggestion(data.suggestion)
        setEditedName(data.suggestion.name)
        setEditedType(data.suggestion.type)
        setEditedPriority(data.suggestion.priority)
      } else {
        throw new Error(data.error || 'Invalid response from AI')
      }
    } catch (err) {
      console.error('[ConvertNoteDialog] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze note')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleConvert = async () => {
    if (!suggestion) return

    setIsConverting(true)

    try {
      await onConvert({
        type: editedType,
        name: editedName,
        purpose: suggestion.purpose,
        priority: editedPriority,
        tags: suggestion.tags,
        acceptanceCriteria: suggestion.acceptanceCriteria,
        estimatedHours: suggestion.estimatedHours,
      })

      // Reset state and close dialog
      setSuggestion(null)
      setError(null)
      onOpenChange(false)
    } catch (err) {
      console.error('[ConvertNoteDialog] Conversion failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to convert note')
    } finally {
      setIsConverting(false)
    }
  }

  const confidenceColor =
    (suggestion?.confidence ?? 0) >= 80
      ? 'text-green-600'
      : (suggestion?.confidence ?? 0) >= 60
      ? 'text-yellow-600'
      : 'text-red-600'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Convert Note to Work Item
          </DialogTitle>
          <DialogDescription>
            AI will analyze your note and suggest the best work item type and properties
          </DialogDescription>
        </DialogHeader>

        {/* Note Preview */}
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="text-sm font-medium text-gray-700 mb-2">Note Content</div>
          <div className="text-sm text-gray-900 whitespace-pre-wrap">{noteContent}</div>
        </div>

        {!suggestion && !error && (
          <div className="flex justify-center py-8">
            <Button onClick={analyzeNote} disabled={isAnalyzing} className="gap-2">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Note
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-red-900">Analysis Failed</div>
              <div className="text-sm text-red-700 mt-1">{error}</div>
              <Button onClick={analyzeNote} variant="outline" size="sm" className="mt-3">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {suggestion && (
          <div className="space-y-4">
            {/* Confidence & Reasoning */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-blue-900">AI Analysis</div>
                <div className={cn('text-sm font-semibold', confidenceColor)}>
                  {suggestion.confidence}% confident
                </div>
              </div>
              <div className="text-sm text-blue-800">{suggestion.reasoning}</div>
            </div>

            {/* Editable Fields */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Work item name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={editedType} onValueChange={setEditedType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="user_story">User Story</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select value={editedPriority} onValueChange={setEditedPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Purpose</Label>
                <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 border">
                  {suggestion.purpose}
                </div>
              </div>

              {suggestion.tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Suggested Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {suggestion.acceptanceCriteria.length > 0 && (
                <div className="space-y-2">
                  <Label>Acceptance Criteria</Label>
                  <ul className="text-sm text-gray-700 space-y-1 bg-gray-50 rounded-md p-3 border">
                    {suggestion.acceptanceCriteria.map((criteria, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-gray-400">•</span>
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestion.estimatedHours && (
                <div className="space-y-2">
                  <Label>Estimated Hours</Label>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 border">
                    {suggestion.estimatedHours} hours
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConverting}>
            Cancel
          </Button>
          {suggestion && (
            <Button onClick={handleConvert} disabled={isConverting || !editedName || !editedType} className="gap-2">
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert to Work Item'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
