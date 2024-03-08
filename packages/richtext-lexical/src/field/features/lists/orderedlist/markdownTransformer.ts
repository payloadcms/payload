import type { ElementTransformer } from '@lexical/markdown'

import lexicalListImport from '@lexical/list'
const { $isListNode, ListItemNode, ListNode } = lexicalListImport

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
