'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { EditWorkItemDialog } from '@/components/work-items/edit-work-item-dialog'
import { WorkspacePhase } from '@/lib/constants/work-item-types'

interface WorkItemEditButtonProps {
  workItemId: string
  workspaceId: string
  phase?: WorkspacePhase  // Optional - defaults to 'launch' (all fields visible)
}

/**
 * Feature Edit Button
 *
 * Client component that handles the edit functionality for features.
 * Opens the EditWorkItemDialog with all fields visible by default.
 *
 * @example
 * ```tsx
 * <WorkItemEditButton
 *   workItemId="feature_123"
 *   workspaceId="workspace_456"
 * />
 * ```
 */
// Updated 2025-12-13: 'complete' → 'launch' in 4-phase system
export function WorkItemEditButton({
  workItemId,
  workspaceId,
  phase = 'launch',  // Default to 'launch' - all fields visible
}: WorkItemEditButtonProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setEditDialogOpen(true)} variant="outline">
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>

      <EditWorkItemDialog
        workItemId={workItemId}
        workspaceId={workspaceId}
        phase={phase}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  )
}
