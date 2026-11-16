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
  const outgoing: 'ghost' | 'none' | 'solid' = position.isLastRendered
    ? 'none'
    : isGroup && shouldConnectChildren
      ? 'solid'
      : position.isLastSibling
        ? 'none'
        : shouldConnectChildren
          ? 'ghost'
          : 'solid'

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
