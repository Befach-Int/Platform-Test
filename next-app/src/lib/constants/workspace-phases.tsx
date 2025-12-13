/**
 * Workspace Phase Configuration - 4-Phase System
 *
 * Updated 2025-12-13: Migrated from 5 phases to 4 phases
 * - design (was research/planning) - "Shape your approach, define your path"
 * - build (was execution) - "Execute with clarity, create with care"
 * - refine (was review) - "Validate ideas, sharpen solutions"
 * - launch (was complete) - "Release, measure, and evolve"
 *
 * Ideation now lives at Workspace level (mind maps, concept boards)
 * not as a work item phase.
 *
 * Color Psychology Sources:
 * - Smashing Magazine: Psychology of Color in UX (2025)
 * - High-contrast accessibility standards
 */

import {
    Pencil,
    Hammer,
    Sparkles,
    Rocket,
    type LucideIcon
} from 'lucide-react';

export type WorkspacePhase =
    | 'design'
    | 'build'
    | 'refine'
    | 'launch';

// Legacy phase types for backward compatibility during migration
export type LegacyWorkspacePhase =
    | 'research'
    | 'planning'
    | 'execution'
    | 'review'
    | 'complete';

export interface PhaseConfig {
    id: WorkspacePhase;
    name: string;
    tagline: string;        // Short motivational tagline
    description: string;
    color: string;          // Hex color
    bgColor: string;        // Tailwind background class
    textColor: string;      // Tailwind text class
    borderColor: string;    // Tailwind border class
    icon: LucideIcon;       // Lucide icon component
    meaning: string;        // Why this color?
    emoji: string;          // Visual indicator
}

/**
 * 4-Phase System Color Palette:
 *
 * Violet → Emerald → Amber → Green
 * (Design → Build → Refine → Launch)
 */
export const PHASE_CONFIG: Record<WorkspacePhase, PhaseConfig> = {
    design: {
        id: 'design',
        name: 'Design',
        tagline: 'Shape your approach, define your path',
        description: 'Solution architecture, MVP scoping, timeline breakdown, priority setting',
        color: '#8B5CF6',        // Violet-500
        bgColor: 'bg-violet-500',
        textColor: 'text-violet-600',
        borderColor: 'border-violet-500',
        icon: Pencil,
        meaning: 'Violet represents strategic thinking, planning, structure - turning ideas into actionable plans',
        emoji: '📐',
    },
    build: {
        id: 'build',
        name: 'Build',
        tagline: 'Execute with clarity, create with care',
        description: 'Active development, implementation, progress tracking, team coordination',
        color: '#10B981',        // Emerald-500
        bgColor: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-500',
        icon: Hammer,
        meaning: 'Emerald green represents action, progress, growth - proven by Duolingo for achievement',
        emoji: '🔨',
    },
    refine: {
        id: 'refine',
        name: 'Refine',
        tagline: 'Validate ideas, sharpen solutions',
        description: 'User testing, feedback collection, bug fixing, stakeholder reviews',
        color: '#F59E0B',        // Amber-500
        bgColor: 'bg-amber-500',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-500',
        icon: Sparkles,
        meaning: 'Amber represents attention, warmth, iteration - invites review and refinement',
        emoji: '✨',
    },
    launch: {
        id: 'launch',
        name: 'Launch',
        tagline: 'Release, measure, and evolve',
        description: 'Ship to production, metrics collection, retrospectives, lessons learned',
        color: '#22C55E',        // Green-500
        bgColor: 'bg-green-500',
        textColor: 'text-green-600',
        borderColor: 'border-green-500',
        icon: Rocket,
        meaning: 'Bright green represents success, achievement, completion - universal success signal',
        emoji: '🚀',
    },
};

/**
 * Phase order for progression visualization
 */
export const PHASE_ORDER: WorkspacePhase[] = [
    'design',
    'build',
    'refine',
    'launch',
];

/**
 * Map legacy phases to new phases for migration
 */
export const LEGACY_PHASE_MAP: Record<LegacyWorkspacePhase, WorkspacePhase> = {
    research: 'design',
    planning: 'design',
    execution: 'build',
    review: 'refine',
    complete: 'launch',
};

/**
 * Convert legacy phase to new phase
 */
export function migratePhase(phase: string): WorkspacePhase {
    if (phase in LEGACY_PHASE_MAP) {
        return LEGACY_PHASE_MAP[phase as LegacyWorkspacePhase];
    }
    if (phase in PHASE_CONFIG) {
        return phase as WorkspacePhase;
    }
    return 'design'; // Default for unknown phases
}

/**
 * Workspace phases array (for components that need id + label)
 */
export const WORKSPACE_PHASES = PHASE_ORDER.map(phase => ({
    id: phase,
    label: PHASE_CONFIG[phase].name,
    color: PHASE_CONFIG[phase].color,
    description: PHASE_CONFIG[phase].description,
    tagline: PHASE_CONFIG[phase].tagline,
    emoji: PHASE_CONFIG[phase].emoji,
}));

/**
 * Calculate which phase a work item is in based on its state
 *
 * NEW 4-Phase Logic (2025-12-13):
 * - design: Initial state, planning, scoping (was research + planning)
 * - build: Active development, in_progress status (was execution)
 * - refine: Review, testing, feedback collection (was review)
 * - launch: Completed, shipped (was complete)
 *
 * Note: Ideation now happens at workspace level (mind maps, not work items)
 */
export function calculateWorkItemPhase(workItem: {
    status?: string;
    phase?: string;           // Direct phase if stored in DB
    has_timeline_breakdown?: boolean;
    assigned_to?: string | null;
    is_mind_map_conversion?: boolean;
    progress_percent?: number;
    actual_start_date?: string | null;
}): WorkspacePhase {
    const {
        status,
        phase,
        has_timeline_breakdown,
        assigned_to,
        progress_percent,
        actual_start_date,
    } = workItem;

    // If phase is explicitly set in DB, use it (after migration)
    if (phase && phase in PHASE_CONFIG) {
        return phase as WorkspacePhase;
    }

    // Handle legacy phases from database
    if (phase && phase in LEGACY_PHASE_MAP) {
        return LEGACY_PHASE_MAP[phase as LegacyWorkspacePhase];
    }

    // Auto-calculate based on status and fields

    // Launch: Completed items
    if (status === 'completed' || status === 'done' || status === 'launched') {
        return 'launch';
    }

    // Refine: Review/testing status
    if (status === 'review' || status === 'in_review' || status === 'pending_review') {
        return 'refine';
    }

    // Build: Active development with significant progress
    if (status === 'in_progress') {
        return 'build';
    }

    // Build: Has actual_start_date or significant progress
    if (actual_start_date || (progress_percent && progress_percent > 0)) {
        return 'build';
    }

    // Build: Assigned and has timeline breakdown
    if (assigned_to && has_timeline_breakdown) {
        return 'build';
    }

    // Design: Everything else (planning, scoping, or new items)
    return 'design';
}

/**
 * Get the next phase in the progression
 */
export function getNextPhase(currentPhase: WorkspacePhase): WorkspacePhase | null {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex >= PHASE_ORDER.length - 1) {
        return null;
    }
    return PHASE_ORDER[currentIndex + 1];
}

/**
 * Get the previous phase in the progression
 */
export function getPreviousPhase(currentPhase: WorkspacePhase): WorkspacePhase | null {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex <= 0) {
        return null;
    }
    return PHASE_ORDER[currentIndex - 1];
}

/**
 * Check if a phase transition is valid (can only move forward or stay)
 */
export function isValidPhaseTransition(from: WorkspacePhase, to: WorkspacePhase): boolean {
    const fromIndex = PHASE_ORDER.indexOf(from);
    const toIndex = PHASE_ORDER.indexOf(to);
    // Can move forward or stay in same phase
    return toIndex >= fromIndex;
}

/**
 * Calculate phase distribution from work items
 * Returns count and percentage for each phase
 */
export function calculatePhaseDistribution(workItems: Array<{
    status?: string;
    phase?: string;
    has_timeline_breakdown?: boolean;
    assigned_to?: string | null;
    is_mind_map_conversion?: boolean;
    progress_percent?: number;
    actual_start_date?: string | null;
}>): Record<WorkspacePhase, { count: number; percentage: number }> {
    const total = workItems.length;

    if (total === 0) {
        return Object.fromEntries(
            PHASE_ORDER.map(phase => [phase, { count: 0, percentage: 0 }])
        ) as Record<WorkspacePhase, { count: number; percentage: number }>;
    }

    const distribution = workItems.reduce((acc, item) => {
        const phase = calculateWorkItemPhase(item);
        acc[phase] = (acc[phase] || 0) + 1;
        return acc;
    }, {} as Record<WorkspacePhase, number>);

    return Object.fromEntries(
        PHASE_ORDER.map(phase => [
            phase,
            {
                count: distribution[phase] || 0,
                percentage: Math.round(((distribution[phase] || 0) / total) * 100),
            },
        ])
    ) as Record<WorkspacePhase, { count: number; percentage: number }>;
}

/**
 * Get phase config by ID (with legacy support)
 */
export function getPhaseConfig(phase: string): PhaseConfig | null {
    // Direct match
    if (phase in PHASE_CONFIG) {
        return PHASE_CONFIG[phase as WorkspacePhase];
    }
    // Legacy phase - migrate and return
    if (phase in LEGACY_PHASE_MAP) {
        const newPhase = LEGACY_PHASE_MAP[phase as LegacyWorkspacePhase];
        return PHASE_CONFIG[newPhase];
    }
    return null;
}

/**
 * Phase permission constants
 *
 * Default permission settings for team members.
 * Owners and admins bypass these restrictions.
 */
export const PHASE_PERMISSIONS = {
    /** All team members can view all phases */
    DEFAULT_VIEW: true,
    /** Edit access requires explicit phase assignment (or admin role) */
    DEFAULT_EDIT: false,
    /** Delete access same as edit */
    DEFAULT_DELETE: false,
} as const;
