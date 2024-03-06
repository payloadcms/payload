import type { ElementTransformer } from '@lexical/markdown'

import { $isListNode, ListItemNode, ListNode } from '@lexical/list'

import { listExport, listReplace } from '../common/markdown.js'

export const ORDERED_LIST: ElementTransformer = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null
  },
  regExp: /^(\s*)(\d+)\.\s/,
  replace: listReplace('number'),
}
