/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */import { createMarkdownExport } from './MarkdownExport.js';
import { createMarkdownImport } from './MarkdownImport.js';
import { registerMarkdownShortcuts } from './MarkdownShortcuts.js';
import { BOLD_ITALIC_STAR, BOLD_ITALIC_UNDERSCORE, BOLD_STAR, BOLD_UNDERSCORE, CHECK_LIST, HEADING, HIGHLIGHT, INLINE_CODE, ITALIC_STAR, ITALIC_UNDERSCORE, normalizeMarkdown, ORDERED_LIST, QUOTE, STRIKETHROUGH, UNORDERED_LIST } from './MarkdownTransformers.js';
const ELEMENT_TRANSFORMERS = [HEADING, QUOTE, UNORDERED_LIST, ORDERED_LIST];
const MULTILINE_ELEMENT_TRANSFORMERS = [];
// Order of text format transformers matters:
//
// - code should go first as it prevents any transformations inside
// - then longer tags match (e.g. ** or __ should go before * or _)
const TEXT_FORMAT_TRANSFORMERS = [INLINE_CODE, BOLD_ITALIC_STAR, BOLD_ITALIC_UNDERSCORE, BOLD_STAR, BOLD_UNDERSCORE, HIGHLIGHT, ITALIC_STAR, ITALIC_UNDERSCORE, STRIKETHROUGH];
const TEXT_MATCH_TRANSFORMERS = [];
const TRANSFORMERS = [...ELEMENT_TRANSFORMERS, ...MULTILINE_ELEMENT_TRANSFORMERS, ...TEXT_FORMAT_TRANSFORMERS, ...TEXT_MATCH_TRANSFORMERS];
/**
 * Renders markdown from a string. The selection is moved to the start after the operation.
 *
 *  @param {boolean} [shouldPreserveNewLines] By setting this to true, new lines will be preserved between conversions
 *  @param {boolean} [shouldMergeAdjacentLines] By setting this to true, adjacent non empty lines will be merged according to commonmark spec: https://spec.commonmark.org/0.24/#example-177. Not applicable if shouldPreserveNewLines = true.
 */
function $convertFromMarkdownString(markdown, transformers = TRANSFORMERS, node, shouldPreserveNewLines = false, shouldMergeAdjacentLines = true) {
  const sanitizedMarkdown = shouldPreserveNewLines ? markdown : normalizeMarkdown(markdown, shouldMergeAdjacentLines);
  const importMarkdown = createMarkdownImport(transformers, shouldPreserveNewLines);
  return importMarkdown(sanitizedMarkdown, node);
}
/**
 * Renders string from markdown. The selection is moved to the start after the operation.
 */
function $convertToMarkdownString(transformers = TRANSFORMERS, node, shouldPreserveNewLines = false) {
  const exportMarkdown = createMarkdownExport(transformers, shouldPreserveNewLines);
  return exportMarkdown(node);
}
export { $convertFromMarkdownString, $convertToMarkdownString, BOLD_ITALIC_STAR, BOLD_ITALIC_UNDERSCORE, BOLD_STAR, BOLD_UNDERSCORE, CHECK_LIST, ELEMENT_TRANSFORMERS, HEADING, HIGHLIGHT, INLINE_CODE, ITALIC_STAR, ITALIC_UNDERSCORE, MULTILINE_ELEMENT_TRANSFORMERS, ORDERED_LIST, QUOTE, registerMarkdownShortcuts, STRIKETHROUGH, TEXT_FORMAT_TRANSFORMERS, TEXT_MATCH_TRANSFORMERS, TRANSFORMERS, UNORDERED_LIST };
//# sourceMappingURL=index.js.map