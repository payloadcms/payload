import { $createHorizontalRuleNode, $isHorizontalRuleNode, HorizontalRuleNode } from './nodes/HorizontalRuleNode.js';
export const MarkdownTransformer = {
  type: 'element',
  dependencies: [HorizontalRuleNode],
  export: (node, exportChildren) => {
    if (!$isHorizontalRuleNode(node)) {
      return null;
    }
    return '---';
  },
  // match ---
  regExp: /^---\s*$/,
  replace: parentNode => {
    const node = $createHorizontalRuleNode();
    if (node) {
      parentNode.replace(node);
    }
  }
};
//# sourceMappingURL=markdownTransformer.js.map