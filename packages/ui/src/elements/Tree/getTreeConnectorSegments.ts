import type { TreeItemVariant, TreePosition } from './types.js'

export function getTreeConnectorSegments({
  hasChildren = false,
  isExpanded = false,
  position,
  variant = 'default',
}: {
  hasChildren?: boolean
  isExpanded?: boolean
  position: TreePosition
  variant?: TreeItemVariant
}) {
  const shouldConnectChildren = hasChildren && isExpanded && !position.isLastRendered
  const isGroup = variant === 'group'
  const outgoing = getOutgoingConnector({ isGroup, position, shouldConnectChildren })

  return {
    ancestorColumns: position.ancestorContinues.flatMap((continues, level) =>
      continues && level < position.indent ? [level] : [],
    ),
    hasChildStem: shouldConnectChildren && !isGroup,
    hasHorizontalConnector: !isGroup,
    outgoing,
    shouldTerminateAncestors: position.isLastRendered,
  }
}

function getOutgoingConnector({
  isGroup,
  position,
  shouldConnectChildren,
}: {
  isGroup: boolean
  position: TreePosition
  shouldConnectChildren: boolean
}): 'ghost' | 'none' | 'solid' {
  if (position.isLastRendered) {
    return 'none'
  }
  if (isGroup && shouldConnectChildren) {
    return 'solid'
  }
  if (position.isLastSibling) {
    return 'none'
  }
  if (shouldConnectChildren) {
    return 'ghost'
  }
  return 'solid'
}
