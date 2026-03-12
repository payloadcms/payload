import type { HeadingTagType } from '@lexical/rich-text'

import { $createHeadingNode, $isHeadingNode, HeadingNode } from '@lexical/rich-text'

import type { ElementTransformer } from '../../packages/@lexical/markdown/MarkdownTransformers.js'

import { createBlockNode } from '../../lexical/utils/markdown/createBlockNode.js'

export const MarkdownTransformer: (enabledHeadingSizes: HeadingTagType[]) => ElementTransformer = (
  enabledHeadingSizes,
) => {
  // Convert enabledHeadingSizes to a list of numbers (1 for h1, 2 for h2, etc.)
  const enabledSizes = enabledHeadingSizes.map((tag) => Number(tag.slice(1)))

  // Create a regex pattern that matches any of the enabled sizes
  const pattern = `^(${enabledSizes.map((size) => `#{${size}}`).join('|')})\\s`
  const regExp = new RegExp(pattern)

  return {
    type: 'element',
    dependencies: [HeadingNode],
    export: (node, exportChildren) => {
      if (!$isHeadingNode(node)) {
        return null
      }
      const level = Number(node.getTag().slice(1))
      return '#'.repeat(level) + ' ' + exportChildren(node)
    },
    regExp,
    replace: createBlockNode((match) => {
      const level = match[1]?.length

      // Validate that the heading level is enabled before creating the node
      // This prevents creating invalid headings when sizes are disabled
      if (level === undefined || !enabledSizes.includes(level)) {
        return null
      }

      const tag = ('h' + level) as HeadingTagType
      return $createHeadingNode(tag)
    }),
  }
}
