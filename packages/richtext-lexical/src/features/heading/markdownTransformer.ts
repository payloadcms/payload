import type { ElementTransformer } from '@lexical/markdown'
import type { HeadingTagType } from '@lexical/rich-text'

// eslint-disable-next-line payload/no-conflicting-lexical-markdown-imports -- PAYLOAD_HEADING intentionally extends upstream HEADING, overriding only its regExp to respect the enabled heading levels
import { HEADING } from '@lexical/markdown'

export const PAYLOAD_HEADING: (enabledHeadingSizes: HeadingTagType[]) => ElementTransformer = (
  enabledHeadingSizes,
) => {
  // Convert enabledHeadingSizes to a list of numbers (1 for h1, 2 for h2, etc.)
  const enabledSizes = enabledHeadingSizes.map((tag) => Number(tag.slice(1)))

  // Only the heading levels enabled in the config should be matched on import.
  const pattern = `^(${enabledSizes.map((size) => `#{${size}}`).join('|')})\\s`

  return {
    ...HEADING,
    regExp: new RegExp(pattern),
  }
}
