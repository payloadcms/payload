import type { SerializedListItemNode } from '@lexical/list'

import type { NodeValidation } from '../../typesServer.js'

export const listItemValidation: NodeValidation<SerializedListItemNode> = ({ node }) => {
  if (typeof node.value !== 'number' || !Number.isFinite(node.value)) {
    return 'List item value must be a finite number.'
  }

  return true
}
