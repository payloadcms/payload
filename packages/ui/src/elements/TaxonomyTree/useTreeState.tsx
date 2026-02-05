import { useCallback, useState } from 'react'

export const useTreeState = (initialExpanded: Set<number | string> = new Set()) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number | string>>(initialExpanded)

  const toggleNode = useCallback((nodeId: number | string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const expandNode = useCallback((nodeId: number | string) => {
    setExpandedNodes((prev) => {
      if (prev.has(nodeId)) {
        return prev
      }
      const next = new Set(prev)
      next.add(nodeId)
      return next
    })
  }, [])

  const collapseNode = useCallback((nodeId: number | string) => {
    setExpandedNodes((prev) => {
      if (!prev.has(nodeId)) {
        return prev
      }
      const next = new Set(prev)
      next.delete(nodeId)
      return next
    })
  }, [])

  const expandAll = useCallback((nodeIds: (number | string)[]) => {
    setExpandedNodes(new Set(nodeIds))
  }, [])

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
  }, [])

  return {
    collapseAll,
    collapseNode,
    expandAll,
    expandedNodes,
    expandNode,
    toggleNode,
  }
}
