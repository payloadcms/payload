import type { Transformer } from '@lexical/markdown'
import type { ElementNode } from 'lexical'

import {
  $convertFromMarkdownString as $convertFromMarkdownStringUpstream,
  // eslint-disable-next-line payload/no-conflicting-lexical-markdown-imports -- this wrapper intentionally uses upstream's default transformer set
  TRANSFORMERS,
} from '@lexical/markdown'

import { normalizeMarkdown } from './normalizeMarkdown.js'

/**
 * Payload's markdown import. Wraps `@lexical/markdown`'s `$convertFromMarkdownString`
 * with Payload's `normalizeMarkdown` preprocessing (nested code fences + table-row
 * whitespace handling).
 *
 * TODO: Remove this wrapper and the `normalizeMarkdown` import once
 * https://github.com/facebook/lexical/pull/8734 is merged and we upgrade to a
 * release that includes it. At that point callers can use `@lexical/markdown`'s
 * `$convertFromMarkdownString` directly.
 *
 * @param shouldPreserveNewLines By setting this to true, new lines will be preserved between conversions.
 * @param shouldMergeAdjacentLines By setting this to true, adjacent non empty lines will be merged according to commonmark spec: https://spec.commonmark.org/0.24/#example-177. Not applicable if shouldPreserveNewLines = true.
 */
export function $convertFromMarkdownString(
  markdown: string,
  transformers: Array<Transformer> = TRANSFORMERS,
  node?: ElementNode,
  shouldPreserveNewLines = false,
  shouldMergeAdjacentLines = false,
): void {
  if (shouldPreserveNewLines) {
    return $convertFromMarkdownStringUpstream(markdown, transformers, node, true)
  }

  // Passing shouldMergeAdjacentLines = false to upstream stops it from
  // re-normalizing markdown that normalizeMarkdown has already normalized.
  const sanitizedMarkdown = normalizeMarkdown(markdown, shouldMergeAdjacentLines)
  return $convertFromMarkdownStringUpstream(sanitizedMarkdown, transformers, node, false, false)
}
