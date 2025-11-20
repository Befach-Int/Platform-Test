'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { CreateFeatureDialog } from '@/components/features/create-feature-dialog';
import { FeaturesViewWrapper } from '@/components/features/features-view-wrapper';
import { PhaseFilterCards } from '@/components/features/phase-filter-cards';
import { calculateWorkItemPhase, type WorkspacePhase } from '@/lib/constants/workspace-phases';

interface FeaturesViewProps {
  workspace: any;
  team: any;
  workItems: any[];
  timelineItems: any[];
  linkedItems: any[];
  tags: any[];
  currentUserId: string;
}

export function FeaturesView({
  workspace,
  team,
  workItems,
  timelineItems,
  linkedItems,
  tags,
  currentUserId,
}: FeaturesViewProps) {
  const [selectedPhase, setSelectedPhase] = useState<WorkspacePhase | null>(null);

  // Get feature counts by status
  const statusCounts = {
    planned: workItems?.filter((f) => f.status === 'planned').length || 0,
    in_progress: workItems?.filter((f) => f.status === 'in_progress').length || 0,
    completed: workItems?.filter((f) => f.status === 'completed').length || 0,
    on_hold: workItems?.filter((f) => f.status === 'on_hold').length || 0,
  };

  // Calculate phase counts
  const phaseCounts = (workItems || []).reduce((acc, item) => {
    const phase = calculateWorkItemPhase(item);
    acc[phase] = (acc[phase] || 0) + 1;
    return acc;
  }, {} as Record<WorkspacePhase, number>);

  // Ensure all phases have a count (even if 0)
  const phases: WorkspacePhase[] = ['research', 'planning', 'execution', 'review', 'complete'];
  phases.forEach(phase => {
    if (!phaseCounts[phase]) phaseCounts[phase] = 0;
  });

  const handlePhaseChange = (phase: WorkspacePhase | null) => {
    setSelectedPhase(phase);
  };

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header with Create Button */}
      <div className="flex items-start justify-between gap-6 pb-2">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Work Board</h2>
          <p className="text-muted-foreground text-base">
            Track and manage all your product work items
          </p>
        </div>
        <CreateFeatureDialog
          workspaceId={workspace.id}
          teamId={workspace.team_id}
          currentUserId={currentUserId}
          workspacePhase={workspace.phase}
        />
      </div>

      {/* Combined Stats + Phase Filters Row */}
      <div className="flex items-center justify-between gap-6 px-4 py-3 bg-white border-2 rounded-lg">
        {/* Left: Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Total:</span>
            <span className="text-lg font-bold tabular-nums">{workItems?.length || 0}</span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">In Progress:</span>
            <span className="text-lg font-bold tabular-nums text-blue-600">
              {statusCounts.in_progress}
            </span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Completed:</span>
            <span className="text-lg font-bold tabular-nums text-green-600">
              {statusCounts.completed}
            </span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">On Hold:</span>
            <span className="text-lg font-bold tabular-nums text-orange-600">
              {statusCounts.on_hold}
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Right: Phase Filter Cards */}
        <PhaseFilterCards
          selectedPhase={selectedPhase}
          onPhaseChange={handlePhaseChange}
          phaseCounts={phaseCounts}
          totalCount={workItems?.length || 0}
        />
      </div>

      {/* Work Items List */}
      {workItems && workItems.length > 0 ? (
        <FeaturesViewWrapper
          initialWorkItems={workItems}
          timelineItems={timelineItems || []}
          workspaceId={workspace.id}
          currentUserId={currentUserId}
          selectedPhase={selectedPhase}
        />
      ) : (
        <Card className="border-2">
          <CardContent className="text-center py-16 px-6">
            <div className="text-7xl mb-6">📋</div>
            <h3 className="text-xl font-semibold mb-3 tracking-tight">
              No work items yet
            </h3>
            <p className="text-muted-foreground text-base mb-6 max-w-md mx-auto">
              Get started by creating your first work item
            </p>
            <CreateFeatureDialog
              workspaceId={workspace.id}
              teamId={workspace.team_id}
              currentUserId={currentUserId}
              workspacePhase={workspace.phase}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
