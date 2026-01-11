'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { WorkspaceModeSelector } from '@/components/workspaces/workspace-mode-selector'
import { type WorkspaceMode, getDefaultWorkspaceMode } from '@/lib/types/workspace-mode'

interface CreateWorkspaceDialogProps {
  teamId: string
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function CreateWorkspaceDialog({ teamId, onSuccess, open: externalOpen, onOpenChange, trigger }: CreateWorkspaceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<WorkspaceMode>(getDefaultWorkspaceMode())

  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create workspace using API endpoint (better error handling)
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          name,
          description,
          mode, // Workspace lifecycle mode (development/launch/growth/maintenance)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Create Workspace] Failed:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to create workspace')
      }

      const { workspace } = await response.json()
      console.log('[Create Workspace] Success:', workspace.id)

      // Reset form
      setName('')
      setDescription('')
      setMode(getDefaultWorkspaceMode())
      setOpen(false)

      // Refresh the page to show new workspace
      router.refresh()
      onSuccess?.()
    } catch (error: unknown) {
      console.error('Error creating workspace:', error)
      const message = error instanceof Error ? error.message : 'Failed to create workspace'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Set up a new project workspace. All modules will be enabled by default.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q2 Product Launch"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the goals and scope of this workspace..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Workspace Mode Selector */}
          <WorkspaceModeSelector
            value={mode}
            onValueChange={setMode}
            disabled={loading}
            showDescription={true}
            showTransitionHint={false}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
