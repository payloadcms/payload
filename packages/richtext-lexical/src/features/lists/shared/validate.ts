import type { SerializedListItemNode, SerializedListNode } from '@lexical/list'

import type { NodeValidation } from '../../typesServer.js'

import { ALLOWED_LIST_TAGS } from './constants.js'

export const listItemValidation: NodeValidation<SerializedListItemNode> = ({ node }) => {
  if (typeof node.value !== 'number' || !Number.isFinite(node.value)) {
    return 'List item value must be a finite number.'
  }

  return true
}

export const listValidation: NodeValidation<SerializedListNode> = ({ node }) => {
  return ALLOWED_LIST_TAGS.has(node.tag) ? true : 'List tag must be one of ol, ul.'
}
