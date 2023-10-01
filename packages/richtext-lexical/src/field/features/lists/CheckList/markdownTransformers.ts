import type { ElementTransformer } from '@lexical/markdown'

import { $isListNode, ListItemNode, ListNode } from '@lexical/list'

import { listExport, listReplace } from '../common/markdown'

export const CHECK_LIST: ElementTransformer = {
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null
  },
  regExp: /^(\s*)(?:-\s)?\s?(\[(\s|x)?\])\s/i,
  replace: listReplace('check'),
  type: 'element',
}
