import { $createHorizontalRuleServerNode, $isHorizontalRuleServerNode, HorizontalRuleServerNode } from './nodes/HorizontalRuleNode.js';
export const MarkdownTransformer = {
  type: 'element',
  dependencies: [HorizontalRuleServerNode],
  export: (node, exportChildren) => {
    if (!$isHorizontalRuleServerNode(node)) {
      return null;
    }
    return '---';
  },
  // match ---
  regExp: /^---\s*$/,
  replace: parentNode => {
    const node = $createHorizontalRuleServerNode();
    if (node) {
      parentNode.replace(node);
    }
  }
};
//# sourceMappingURL=markdownTransformer.js.map