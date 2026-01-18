import { $isListNode, ListItemNode, ListNode } from '@lexical/list';
import { listExport, listReplace } from '../shared/markdown.js';
export const ORDERED_LIST = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null;
  },
  regExp: /^(\s*)(\d+)\.\s/,
  replace: listReplace('number')
};
//# sourceMappingURL=markdownTransformer.js.map