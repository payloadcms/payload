import type { ElementTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

import {
  $createHorizontalRuleServerNode,
  $isHorizontalRuleServerNode,
  HorizontalRuleServerNode,
} from './nodes/HorizontalRuleNode.js'

export const MarkdownTransformer: ElementTransformer = {
  type: 'element',
  dependencies: [HorizontalRuleServerNode],
  export: (node, exportChildren) => {
    if (!$isHorizontalRuleServerNode(node)) {
      return null
    }
    return '---'
  },
  // match ---
  regExp: /^---\s*$/,
  replace: (parentNode) => {
    const node = $createHorizontalRuleServerNode()
    if (node) {
      parentNode.replace(node)
    }
  },
}
