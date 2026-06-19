/**
 * Payload's markdown entrypoint.
 *
 * Previously Payload vendored a full copy of `@lexical/markdown` (it could not
 * depend on the published package because, prior to lexical 0.42, importing it
 * transitively pulled in `@lexical/code` and its `prismjs` dependency, which
 * broke type generation). Since lexical 0.42 the markdown package depends on
 * `@lexical/code-core` (no prism), so the vendored copy is no longer needed.
 *
 * This module re-exports the upstream package and only keeps the Payload
 * specific behaviors that the fork added on top of it:
 * - `$convertFromMarkdownString` merges adjacent lines by default
 *   (`shouldMergeAdjacentLines = true`), whereas upstream defaults to `false`.
 * - The default transformer set excludes the upstream `CODE` and `LINK`
 *   transformers, since Payload provides those as features with its own node
 *   types.
 * - Markdown is normalized with Payload's own `normalizeMarkdown` (handles
 *   nested code fences and preserves table-row whitespace) instead of the
 *   upstream normalizer, which is not exported and lacks those behaviors.
 */
import type { ElementNode } from 'lexical'

import {
  $convertFromMarkdownString as $convertFromMarkdownStringUpstream,
  $convertToMarkdownString as $convertToMarkdownStringUpstream,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  type ElementTransformer,
  HEADING,
  HIGHLIGHT,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  type MultilineElementTransformer,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  type TextFormatTransformer,
  type TextMatchTransformer,
  type Transformer,
  UNORDERED_LIST,
} from '@lexical/markdown'

import { normalizeMarkdown } from '../lexical/utils/markdown/normalizeMarkdown.js'

const ELEMENT_TRANSFORMERS: Array<ElementTransformer> = [
  HEADING,
  QUOTE,
  UNORDERED_LIST,
  ORDERED_LIST,
]

const MULTILINE_ELEMENT_TRANSFORMERS: Array<MultilineElementTransformer> = []

// Order of text format transformers matters:
//
// - code should go first as it prevents any transformations inside
// - then longer tags match (e.g. ** or __ should go before * or _)
const TEXT_FORMAT_TRANSFORMERS: Array<TextFormatTransformer> = [
  INLINE_CODE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  HIGHLIGHT,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
]

const TEXT_MATCH_TRANSFORMERS: Array<TextMatchTransformer> = []

const TRANSFORMERS: Array<Transformer> = [
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
]

/**
 * Renders markdown from a string. The selection is moved to the start after the operation.
 *
 *  @param {boolean} [shouldPreserveNewLines] By setting this to true, new lines will be preserved between conversions
 *  @param {boolean} [shouldMergeAdjacentLines] By setting this to true, adjacent non empty lines will be merged according to commonmark spec: https://spec.commonmark.org/0.24/#example-177. Not applicable if shouldPreserveNewLines = true.
 */
function $convertFromMarkdownString(
  markdown: string,
  transformers: Array<Transformer> = TRANSFORMERS,
  node?: ElementNode,
  shouldPreserveNewLines = false,
  shouldMergeAdjacentLines = true,
): void {
  if (shouldPreserveNewLines) {
    return $convertFromMarkdownStringUpstream(markdown, transformers, node, true)
  }

  // Normalize with Payload's normalizer, then let upstream import the result.
  // Passing shouldMergeAdjacentLines = false stops upstream's internal
  // normalizer from re-merging the already normalized markdown; for non empty
  // lines it preserves trailing whitespace and hard line breaks, so the only
  // observable difference is that whitespace-only lines collapse to empty.
  const sanitizedMarkdown = normalizeMarkdown(markdown, shouldMergeAdjacentLines)
  return $convertFromMarkdownStringUpstream(sanitizedMarkdown, transformers, node, false, false)
}

/**
 * Renders string from markdown. The selection is moved to the start after the operation.
 */
function $convertToMarkdownString(
  transformers: Array<Transformer> = TRANSFORMERS,
  node?: ElementNode,
  shouldPreserveNewLines: boolean = false,
): string {
  return $convertToMarkdownStringUpstream(transformers, node, shouldPreserveNewLines)
}

export {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CHECK_LIST,
  type ElementTransformer,
  HEADING,
  HIGHLIGHT,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  type MultilineElementTransformer,
  ORDERED_LIST,
  QUOTE,
  registerMarkdownShortcuts,
  STRIKETHROUGH,
  type TextFormatTransformer,
  type TextMatchTransformer,
  type Transformer,
  UNORDERED_LIST,
} from '@lexical/markdown'

export {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  TRANSFORMERS,
}
