'use client'

import type { RefObject } from 'react'
import {
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Palette,
  LayoutGrid,
  Undo2,
  Redo2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { BlockSuiteMindmapStyle, BlockSuiteLayoutType } from './mindmap-types'

// ============================================================================
// ZOOM CONSTANTS
// ============================================================================

/** Minimum zoom level (10%) */
const ZOOM_MIN = 0.1
/** Maximum zoom level (300%) */
const ZOOM_MAX = 3.0
/** Zoom increment per step */
const ZOOM_STEP = 0.1
/** Default zoom level for fit view */
const ZOOM_DEFAULT = 1.0

/**
 * Props for the MindmapToolbar component
 */
export interface MindmapToolbarProps {
  /** Reference to the BlockSuite editor for operations */
  editorRef: RefObject<unknown>
  /** Document reference for block operations */
  docRef: RefObject<unknown>
  /** ID of the mindmap element in the surface */
  mindmapId: string | null
  /** Currently selected node ID */
  selectedNodeId: string | null
  /** Current mindmap style */
  style: BlockSuiteMindmapStyle
  /** Callback when style changes */
  onStyleChange?: (style: BlockSuiteMindmapStyle) => void
  /** Current layout type */
  layout: BlockSuiteLayoutType
  /** Callback when layout changes */
  onLayoutChange?: (layout: BlockSuiteLayoutType) => void
  /** Callback to add a child node to the selected node */
  onAddChild?: (parentNodeId: string) => void
  /** Callback to add a sibling node to the selected node */
  onAddSibling?: (siblingNodeId: string) => void
  /** Callback to delete the selected node */
  onDeleteNode?: (nodeId: string) => void
  /** Callback to undo the last operation */
  onUndo?: () => void
  /** Callback to redo the last undone operation */
  onRedo?: () => void
  /** Whether canvas is read-only */
  readOnly?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Style option labels for display
 */
const STYLE_OPTIONS: { value: string; label: string }[] = [
  { value: String(BlockSuiteMindmapStyle.ONE), label: 'Classic' },
  { value: String(BlockSuiteMindmapStyle.TWO), label: 'Bubble' },
  { value: String(BlockSuiteMindmapStyle.THREE), label: 'Box' },
  { value: String(BlockSuiteMindmapStyle.FOUR), label: 'Wireframe' },
]

/**
 * Layout option labels for display
 */
const LAYOUT_OPTIONS: { value: string; label: string }[] = [
  { value: String(BlockSuiteLayoutType.RIGHT), label: 'Right' },
  { value: String(BlockSuiteLayoutType.LEFT), label: 'Left' },
  { value: String(BlockSuiteLayoutType.BALANCE), label: 'Balanced' },
]

/**
 * MindmapToolbar provides controls for BlockSuite mindmap operations
 *
 * Features:
 * - Add/delete nodes
 * - Zoom controls
 * - Style and layout selection
 */
function MindmapToolbar({
  editorRef,
  docRef: _docRef,
  mindmapId,
  selectedNodeId,
  style,
  onStyleChange,
  layout,
  onLayoutChange,
  onAddChild,
  onAddSibling,
  onDeleteNode,
  onUndo,
  onRedo,
  readOnly = false,
  className,
}: MindmapToolbarProps) {
  // Determine if node operations should be disabled
  const isNodeSelected = selectedNodeId !== null
  const isRootSelected = selectedNodeId === mindmapId
  const canAddChild = isNodeSelected && !readOnly && !!onAddChild
  const canAddSibling = isNodeSelected && !isRootSelected && !readOnly && !!onAddSibling
  const canDelete = isNodeSelected && !isRootSelected && !readOnly && !!onDeleteNode

  /**
   * Add a child node to the currently selected node
   */
  const handleAddChild = () => {
    if (!canAddChild || !selectedNodeId) return
    onAddChild?.(selectedNodeId)
  }

  /**
   * Add a sibling node to the currently selected node
   */
  const handleAddSibling = () => {
    if (!canAddSibling || !selectedNodeId) return
    onAddSibling?.(selectedNodeId)
  }

  /**
   * Delete the currently selected node
   */
  const handleDelete = () => {
    if (!canDelete || !selectedNodeId) return
    onDeleteNode?.(selectedNodeId)
  }

  /**
   * Undo the last operation
   */
  const handleUndo = () => {
    onUndo?.()
  }

  /**
   * Redo the last undone operation
   */
  const handleRedo = () => {
    onRedo?.()
  }

  /**
   * Zoom in the viewport
   * Attempts to access BlockSuite viewport API
   */
  const handleZoomIn = () => {
    try {
      const editor = editorRef.current as {
        host?: {
          std?: {
            get?: (key: string) => {
              setZoom?: (zoom: number) => void
              zoom?: number
            } | undefined
          }
        }
      } | null
      const viewport = editor?.host?.std?.get?.('viewport')
      if (viewport?.setZoom && typeof viewport.zoom === 'number') {
        viewport.setZoom(Math.min(viewport.zoom + ZOOM_STEP, ZOOM_MAX))
      } else {
        console.log('[MindmapToolbar] Zoom in - viewport API not available')
      }
    } catch (error) {
      console.error('[MindmapToolbar] Zoom in error:', error)
    }
  }

  /**
   * Zoom out the viewport
   * Attempts to access BlockSuite viewport API
   */
  const handleZoomOut = () => {
    try {
      const editor = editorRef.current as {
        host?: {
          std?: {
            get?: (key: string) => {
              setZoom?: (zoom: number) => void
              zoom?: number
            } | undefined
          }
        }
      } | null
      const viewport = editor?.host?.std?.get?.('viewport')
      if (viewport?.setZoom && typeof viewport.zoom === 'number') {
        viewport.setZoom(Math.max(viewport.zoom - ZOOM_STEP, ZOOM_MIN))
      } else {
        console.log('[MindmapToolbar] Zoom out - viewport API not available')
      }
    } catch (error) {
      console.error('[MindmapToolbar] Zoom out error:', error)
    }
  }

  /**
   * Fit the viewport to show all content
   * Attempts to access BlockSuite viewport API
   */
  const handleFitView = () => {
    try {
      const editor = editorRef.current as {
        host?: {
          std?: {
            get?: (key: string) => {
              setViewportByBound?: (
                bound: unknown,
                padding?: number[]
              ) => void
              setZoom?: (zoom: number) => void
            } | undefined
          }
        }
      } | null
      const viewport = editor?.host?.std?.get?.('viewport')
      if (viewport?.setZoom) {
        // Reset zoom to default as a fallback fit behavior
        viewport.setZoom(ZOOM_DEFAULT)
        console.log('[MindmapToolbar] Fit view - reset to default zoom')
      } else {
        console.log('[MindmapToolbar] Fit view - viewport API not available')
      }
    } catch (error) {
      console.error('[MindmapToolbar] Fit view error:', error)
    }
  }

  /**
   * Handle style selection change
   */
  const handleStyleChange = (value: string) => {
    const newStyle = parseInt(value, 10) as BlockSuiteMindmapStyle
    onStyleChange?.(newStyle)
  }

  /**
   * Handle layout selection change
   */
  const handleLayoutChange = (value: string) => {
    const newLayout = parseInt(value, 10) as BlockSuiteLayoutType
    onLayoutChange?.(newLayout)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm',
          className
        )}
      >
        {/* Node Operations Group */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleAddChild}
                disabled={!canAddChild}
                aria-label="Add child node"
              >
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add child node</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleAddSibling}
                disabled={!canAddSibling}
                aria-label="Add sibling node"
              >
                <Plus className="size-4 rotate-90" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add sibling node</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDelete}
                disabled={!canDelete}
                aria-label="Delete node"
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete selected node</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Zoom Controls Group */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleZoomOut}
                aria-label="Zoom out"
              >
                <ZoomOut className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleZoomIn}
                aria-label="Zoom in"
              >
                <ZoomIn className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleFitView}
                aria-label="Fit to view"
              >
                <Maximize2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to view</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Style and Layout Group */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Palette className="size-4 text-muted-foreground" />
                <Select
                  value={String(style)}
                  onValueChange={handleStyleChange}
                  disabled={readOnly}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-7 w-[90px]"
                    aria-label="Select mindmap style"
                  >
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>Change mindmap style</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <LayoutGrid className="size-4 text-muted-foreground" />
                <Select
                  value={String(layout)}
                  onValueChange={handleLayoutChange}
                  disabled={readOnly}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-7 w-[90px]"
                    aria-label="Select mindmap layout"
                  >
                    <SelectValue placeholder="Layout" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>Change mindmap layout</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Undo/Redo Group */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleUndo}
                disabled={readOnly || !onUndo}
                aria-label="Undo"
              >
                <Undo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRedo}
                disabled={readOnly || !onRedo}
                aria-label="Redo"
              >
                <Redo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}

export { MindmapToolbar }
