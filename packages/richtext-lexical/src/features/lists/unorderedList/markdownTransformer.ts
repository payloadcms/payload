import { $isListNode, ListItemNode, ListNode } from '@lexical/list'

import type { ElementTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

import { listExport, listReplace } from '../shared/markdown.js'

export const UNORDERED_LIST: ElementTransformer = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null
  },
  regExp: /^(\s*)[-*+]\s/,
  replace: listReplace('bullet'),
}
