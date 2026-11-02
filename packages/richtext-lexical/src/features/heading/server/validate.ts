import type { HeadingTagType, SerializedHeadingNode } from '@lexical/rich-text'

import type { NodeValidation } from '../../typesServer.js'

import { ALLOWED_HEADING_TAGS } from '../constants.js'

export const headingValidation = ({
  enabledHeadingSizes,
}: {
  enabledHeadingSizes: HeadingTagType[]
}): NodeValidation<SerializedHeadingNode> => {
  const allowedHeadingTags = new Set(
    enabledHeadingSizes.filter((tag) => ALLOWED_HEADING_TAGS.has(tag)),
  )

  return ({ node }) => {
    if (allowedHeadingTags.has(node.tag)) {
      return true
    }

    return allowedHeadingTags.size > 0
      ? `Heading tag must be one of ${Array.from(allowedHeadingTags).join(', ')}.`
      : 'Headings are not enabled.'
  }
}
