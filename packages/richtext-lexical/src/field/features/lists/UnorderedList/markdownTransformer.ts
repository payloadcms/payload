import type { ElementTransformer } from '@lexical/markdown'

import { $isListNode, ListItemNode, ListNode } from '@lexical/list'

import { listExport, listReplace } from '../common/markdown'

export const UNORDERED_LIST: ElementTransformer = {
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null
  },
  regExp: /^(\s*)[-*+]\s/,
  replace: listReplace('bullet'),
  type: 'element',
}
