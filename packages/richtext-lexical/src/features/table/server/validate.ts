import type { SerializedTableCellNode } from '@lexical/table'

import type { NodeValidation } from '../../typesServer.js'

export const tableCellValidation: NodeValidation<SerializedTableCellNode> = ({ node }) => {
  if (!Number.isInteger(node.headerState)) {
    return 'Table cell headerState must be an integer.'
  }

  for (const spanKey of ['colSpan', 'rowSpan'] as const) {
    const span = node[spanKey]

    if (span !== undefined && span !== null && !Number.isInteger(span)) {
      return `Table cell ${spanKey} must be an integer.`
    }
  }

  return true
}
