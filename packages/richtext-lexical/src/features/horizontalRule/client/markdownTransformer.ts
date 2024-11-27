import type { ElementTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from './nodes/HorizontalRuleNode.js'

export const MarkdownTransformer: ElementTransformer = {
  type: 'element',
  dependencies: [HorizontalRuleNode],
  export: (node, exportChildren) => {
    if (!$isHorizontalRuleNode(node)) {
      return null
    }
    return '---'
  },
  // match ---
  regExp: /^---\s*$/,
  replace: (parentNode) => {
    const node = $createHorizontalRuleNode()
    if (node) {
      parentNode.replace(node)
    }
  },
}
