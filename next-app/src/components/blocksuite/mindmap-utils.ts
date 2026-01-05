/**
 * BlockSuite MindMap Conversion Utilities
 *
 * Utilities for converting between ReactFlow flat node/edge format
 * and BlockSuite's nested tree structure.
 */

import type { MindMapNode, MindMapEdge } from '@/lib/types/mind-map'
import type {
  BlockSuiteMindmapNode,
  BlockSuiteMindmapNodeWithMeta,
  ConversionResult,
} from './mindmap-types'

/**
 * Convert ReactFlow flat nodes and edges to BlockSuite tree structure
 *
 * ReactFlow uses flat arrays with edges defining relationships (DAG/graph structure).
 * BlockSuite uses a nested tree structure where each node has exactly ONE parent.
 *
 * **Important**: This conversion may lose edge information when multiple edges point
 * to the same node. BlockSuite trees cannot represent DAG structures - when a node
 * has multiple incoming edges, only the first parent-child relationship is preserved.
 * Lost edges are reported in the warnings array.
 *
 * @param nodes - Array of ReactFlow nodes
 * @param edges - Array of edges connecting nodes
 * @returns ConversionResult with tree, orphaned nodes, and warnings about lost edges
 */
export function reactFlowToBlockSuiteTree(
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): ConversionResult {
  const warnings: string[] = []
  const orphanedNodes: string[] = []

  if (nodes.length === 0) {
    return { tree: null, orphanedNodes: [], warnings: [] }
  }

  // Build adjacency map: parent -> children
  const childrenMap = new Map<string, string[]>()
  const hasParent = new Set<string>()
  // Track all incoming edges per node to detect and report lost edges
  const incomingEdgesMap = new Map<string, string[]>()

  for (const edge of edges) {
    const sourceId = edge.source_node_id
    const targetId = edge.target_node_id

    if (!childrenMap.has(sourceId)) {
      childrenMap.set(sourceId, [])
    }
    childrenMap.get(sourceId)?.push(targetId)
    hasParent.add(targetId)

    // Track all incoming edges for lost edge detection
    if (!incomingEdgesMap.has(targetId)) {
      incomingEdgesMap.set(targetId, [])
    }
    incomingEdgesMap.get(targetId)?.push(sourceId)
  }

  // Find root nodes (nodes without parents)
  const rootNodes = nodes.filter((node) => !hasParent.has(node.id))

  if (rootNodes.length === 0) {
    warnings.push('No root nodes found - possible circular references')
    // Try to find a node to use as root
    if (nodes.length > 0) {
      rootNodes.push(nodes[0])
      warnings.push(`Using first node "${nodes[0].title}" as root`)
    }
  }

  if (rootNodes.length > 1) {
    warnings.push(
      `Multiple root nodes found (${rootNodes.length}). Using first as primary, others as children.`
    )
  }

  // Create node lookup map
  const nodeMap = new Map<string, MindMapNode>()
  for (const node of nodes) {
    nodeMap.set(node.id, node)
  }

  // Track all processed nodes for orphan detection and deduplication.
  // Also track which parent each node was assigned to for lost edge reporting.
  //
  // DESIGN DECISION: processedNodes is intentionally GLOBAL across all roots.
  // This is correct because:
  // 1. ReactFlow node IDs are globally unique within a canvas
  // 2. Each node should appear exactly ONCE in the final BlockSuite tree
  // 3. BlockSuite trees cannot represent DAG structures (nodes with multiple parents)
  // 4. When a node has multiple incoming edges, we assign it to the FIRST parent
  //    that processes it and report the lost edges as warnings
  //
  // This is the expected behavior for DAG-to-tree conversion. If you need to preserve
  // all relationships, consider using a different data structure or duplicating nodes.
  const processedNodes = new Set<string>()
  const assignedParent = new Map<string, string>() // nodeId -> parentId that processed it

  // Recursively build tree with cycle detection per traversal
  function buildTree(
    nodeId: string,
    parentId: string | null,
    depth = 0,
    currentPath = new Set<string>()
  ): BlockSuiteMindmapNodeWithMeta | null {
    // Skip if already processed - this node is already in the tree under a different parent
    if (processedNodes.has(nodeId)) {
      // Report lost edge: this parent wanted to connect to this node but can't
      if (parentId) {
        const assignedTo = assignedParent.get(nodeId)
        const nodeName = nodeMap.get(nodeId)?.title || nodeId
        const parentName = nodeMap.get(parentId)?.title || parentId
        const assignedParentName = assignedTo ? (nodeMap.get(assignedTo)?.title || assignedTo) : 'root'
        warnings.push(
          `Lost edge: "${parentName}" → "${nodeName}" (node already assigned to "${assignedParentName}"). ` +
          `BlockSuite trees cannot have multiple parents per node.`
        )
      }
      return null
    }

    // Prevent infinite loops (cycle detection within current traversal path)
    if (currentPath.has(nodeId)) {
      warnings.push(`Circular reference detected at node "${nodeId}"`)
      return null
    }

    // Track this node in current path for cycle detection
    const pathWithCurrent = new Set(currentPath).add(nodeId)

    // Prevent too deep trees (safety limit)
    if (depth > 20) {
      warnings.push(`Tree depth limit (20) reached at node "${nodeId}"`)
      return null
    }

    const node = nodeMap.get(nodeId)
    if (!node) {
      orphanedNodes.push(nodeId)
      return null
    }

    // Mark as processed and record the parent that claimed this node
    processedNodes.add(nodeId)
    if (parentId) {
      assignedParent.set(nodeId, parentId)
    }

    const children: BlockSuiteMindmapNodeWithMeta[] = []
    const childIds = childrenMap.get(nodeId) || []

    for (const childId of childIds) {
      const childTree = buildTree(childId, nodeId, depth + 1, pathWithCurrent)
      if (childTree) {
        children.push(childTree)
      }
    }

    // Convert position to xywh format
    const x = node.position?.x ?? 0
    const y = node.position?.y ?? 0
    const width = node.width ?? 150
    const height = node.height ?? 100
    const xywh = `${x},${y},${width},${height}`

    const result: BlockSuiteMindmapNodeWithMeta = {
      text: node.title || 'Untitled',
      xywh,
      nodeType: node.node_type,
      originalId: node.id,
      data: node.data,
    }

    if (children.length > 0) {
      result.children = children
    }

    return result
  }

  // Build tree from first root node
  const primaryRoot = rootNodes[0]
  const tree = buildTree(primaryRoot.id, null)

  // If we have multiple roots, add them as children of the primary
  if (rootNodes.length > 1 && tree) {
    const additionalRoots: BlockSuiteMindmapNodeWithMeta[] = []
    for (let i = 1; i < rootNodes.length; i++) {
      // Each additional root starts with a fresh path for cycle detection
      // Use primaryRoot.id as the parent for lost edge reporting
      const additionalTree = buildTree(rootNodes[i].id, primaryRoot.id, 0, new Set<string>())
      if (additionalTree) {
        additionalRoots.push(additionalTree)
      }
    }
    if (additionalRoots.length > 0) {
      tree.children = [...(tree.children || []), ...additionalRoots]
    }
  }

  // Find any truly orphaned nodes (not connected at all)
  for (const node of nodes) {
    if (!processedNodes.has(node.id)) {
      orphanedNodes.push(node.id)
      warnings.push(`Node "${node.title}" (${node.id}) is not connected to the tree`)
    }
  }

  return { tree, orphanedNodes, warnings }
}

/**
 * Convert BlockSuite tree back to ReactFlow flat format
 *
 * @param tree - BlockSuite tree structure
 * @returns Object with nodes and edges arrays
 */
export function blockSuiteTreeToReactFlow(
  tree: BlockSuiteMindmapNode
): { nodes: Partial<MindMapNode>[]; edges: Partial<MindMapEdge>[] } {
  const nodes: Partial<MindMapNode>[] = []
  const edges: Partial<MindMapEdge>[] = []
  let idCounter = Date.now()

  function traverse(
    node: BlockSuiteMindmapNode | BlockSuiteMindmapNodeWithMeta,
    parentId?: string
  ): string {
    const nodeId = (node as BlockSuiteMindmapNodeWithMeta).originalId || (idCounter++).toString()

    // Parse xywh if present
    let x = 0,
      y = 0,
      width = 150,
      height = 100
    if (node.xywh) {
      const parts = node.xywh.split(',').map(Number)
      if (parts.length >= 4) {
        ;[x, y, width, height] = parts
      }
    }

    const mindMapNode: Partial<MindMapNode> = {
      id: nodeId,
      title: node.text,
      position: { x, y },
      width,
      height,
      node_type: (node as BlockSuiteMindmapNodeWithMeta).nodeType || 'idea',
      data: (node as BlockSuiteMindmapNodeWithMeta).data || {},
    }

    nodes.push(mindMapNode)

    // Create edge from parent
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source_node_id: parentId,
        target_node_id: nodeId,
      })
    }

    // Process children
    if (node.children) {
      for (const child of node.children) {
        traverse(child, nodeId)
      }
    }

    return nodeId
  }

  traverse(tree)

  return { nodes, edges }
}

/**
 * Convert a single semantic node to BlockSuite mindmap node
 *
 * @param node - MindMapNode from our database
 * @returns BlockSuiteMindmapNode
 */
export function semanticNodeToMindmapNode(node: MindMapNode): BlockSuiteMindmapNodeWithMeta {
  const x = node.position?.x ?? 0
  const y = node.position?.y ?? 0
  const width = node.width ?? 150
  const height = node.height ?? 100

  return {
    text: node.title,
    xywh: `${x},${y},${width},${height}`,
    nodeType: node.node_type,
    originalId: node.id,
    data: node.data,
  }
}

/**
 * Create a simple tree structure from text lines (markdown-like)
 *
 * Handles missing intermediate indentation levels gracefully by treating
 * deeply indented lines as direct children when their expected parent level
 * doesn't exist.
 *
 * @param text - Multi-line text with indentation representing hierarchy
 * @returns BlockSuiteMindmapNode tree
 *
 * @example
 * // Standard hierarchy
 * const tree = textToMindmapTree(`
 *   Central Idea
 *     Branch 1
 *       Leaf 1.1
 *     Branch 2
 * `)
 *
 * @example
 * // Missing intermediate level (8 spaces without 4-space parent)
 * // The deeply indented line becomes a direct child
 * const tree = textToMindmapTree(`
 *   Root
 *           Deep Child
 * `)
 * // Result: Root -> Deep Child (flattened)
 */
export function textToMindmapTree(text: string): BlockSuiteMindmapNode | null {
  const lines = text
    .split('\n')
    .map((line) => ({
      indent: line.search(/\S/),
      text: line.trim(),
    }))
    .filter((line) => line.text.length > 0 && line.indent >= 0)

  if (lines.length === 0) return null

  function buildFromLines(
    startIdx: number,
    baseIndent: number
  ): { node: BlockSuiteMindmapNode; endIdx: number } | null {
    if (startIdx >= lines.length) return null

    const line = lines[startIdx]
    if (line.indent < baseIndent) return null

    const node: BlockSuiteMindmapNode = {
      text: line.text,
      children: [],
    }

    let idx = startIdx + 1
    while (idx < lines.length) {
      const nextLine = lines[idx]
      if (nextLine.indent <= baseIndent) break

      // Process any line with deeper indentation as a child.
      // This handles both:
      // 1. Lines exactly one indent level deeper (normal case)
      // 2. Lines with missing intermediate levels (e.g., 8 spaces when expecting 4)
      //
      // For missing intermediate levels, we treat the deeply indented line
      // as a direct child, which "flattens" the hierarchy but preserves all nodes.
      // This is better than orphaning nodes silently.
      if (nextLine.indent > baseIndent) {
        const childResult = buildFromLines(idx, nextLine.indent)
        if (childResult) {
          node.children?.push(childResult.node)
          idx = childResult.endIdx
        } else {
          idx++
        }
      } else {
        idx++
      }
    }

    if (node.children?.length === 0) {
      delete node.children
    }

    return { node, endIdx: idx }
  }

  // Use minimum indent as base (in case first line is not the least indented)
  // This handles cases where input text has varying indentation levels
  const minBaseIndent = Math.min(...lines.map((l) => l.indent))
  const result = buildFromLines(0, minBaseIndent)
  return result?.node || null
}

/**
 * Calculate the depth of a mindmap tree
 *
 * @param tree - Root node of the tree
 * @returns Maximum depth of the tree
 */
export function getTreeDepth(tree: BlockSuiteMindmapNode): number {
  if (!tree.children || tree.children.length === 0) {
    return 1
  }
  return 1 + Math.max(...tree.children.map(getTreeDepth))
}

/**
 * Count total nodes in a mindmap tree
 *
 * @param tree - Root node of the tree
 * @returns Total number of nodes
 */
export function countTreeNodes(tree: BlockSuiteMindmapNode): number {
  if (!tree.children || tree.children.length === 0) {
    return 1
  }
  return 1 + tree.children.reduce((sum, child) => sum + countTreeNodes(child), 0)
}
