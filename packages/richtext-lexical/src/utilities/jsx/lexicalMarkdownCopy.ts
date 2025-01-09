import type { ElementNode } from 'lexical'

import type {
  MultilineElementTransformer as _MultilineElementTransformer,
  Transformer,
} from '../../packages/@lexical/markdown/index.js'

import {
  $convertFromMarkdownString as $originalConvertFromMarkdownString,
  TRANSFORMERS,
} from '../../packages/@lexical/markdown/index.js'
import { normalizeMarkdown } from '../../packages/@lexical/markdown/MarkdownTransformers.js'

/**
 * Renders markdown from a string. The selection is moved to the start after the operation.
 *
 *  @param {boolean} [shouldPreserveNewLines] By setting this to true, new lines will be preserved between conversions
 *  @param {boolean} [shouldMergeAdjacentLines] By setting this to true, adjacent non empty lines will be merged according to commonmark spec: https://spec.commonmark.org/0.24/#example-177. Not applicable if shouldPreserveNewLines = true.
 */
export function $convertFromMarkdownString(
  markdown: string,
  transformers: Array<Transformer> = TRANSFORMERS,
  node?: ElementNode,
  shouldPreserveNewLines = false,
  shouldMergeAdjacentLines = true,
): void {
  const sanitizedMarkdown = shouldPreserveNewLines
    ? markdown
    : normalizeMarkdown(markdown, shouldMergeAdjacentLines)

  return $originalConvertFromMarkdownString(sanitizedMarkdown, transformers, node) // shouldPreserveNewLines to true, as we do our own, modified markdown normalization here.
}
