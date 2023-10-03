import type { ElementTransformer } from '@lexical/markdown'
import type { HeadingTagType } from '@lexical/rich-text'

import { $createHeadingNode, $isHeadingNode, HeadingNode } from '@lexical/rich-text'

import { createBlockNode } from '../../lexical/utils/markdown/createBlockNode'

export const MarkdownTransformer: ElementTransformer = {
  dependencies: [HeadingNode],
  export: (node, exportChildren) => {
    if (!$isHeadingNode(node)) {
      return null
    }
    const level = Number(node.getTag().slice(1))
    return '#'.repeat(level) + ' ' + exportChildren(node)
  },
  regExp: /^(#{1,6})\s/,
  replace: createBlockNode((match) => {
    const tag = ('h' + match[1].length) as HeadingTagType
    return $createHeadingNode(tag)
  }),
  type: 'element',
}
