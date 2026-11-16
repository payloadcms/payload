import type React from 'react'

import type { TreeItemVariant, TreePosition } from '../types.js'

import { getTreeConnectorSegments } from '../getTreeConnectorSegments.js'
import './index.css'

export function TreeConnectors({
  hasChildren,
  isExpanded,
  position,
  variant,
}: {
  hasChildren?: boolean
  isExpanded?: boolean
  position: TreePosition
  variant?: TreeItemVariant
}) {
  const segments = getTreeConnectorSegments({ hasChildren, isExpanded, position, variant })

  return (
    <span aria-hidden="true" className="tree-connectors">
      {segments.ancestorColumns.map((level) => (
        <span
          className="tree-connectors__ancestor"
          data-level={level}
          data-terminated={segments.shouldTerminateAncestors || undefined}
          key={level}
          style={{ '--tree-ancestor-level': level } as React.CSSProperties}
        />
      ))}
      <span className="tree-connectors__incoming" />
      {segments.outgoing !== 'none' && (
        <span className="tree-connectors__outgoing" data-style={segments.outgoing} />
      )}
      {segments.hasHorizontalConnector && <span className="tree-connectors__arm" />}
      {segments.hasChildStem && <span className="tree-connectors__stem" />}
    </span>
  )
}
