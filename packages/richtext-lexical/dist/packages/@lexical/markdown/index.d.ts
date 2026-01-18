/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { ElementNode } from 'lexical';
import type { ElementTransformer, MultilineElementTransformer, TextFormatTransformer, TextMatchTransformer, Transformer } from './MarkdownTransformers.js';
import { registerMarkdownShortcuts } from './MarkdownShortcuts.js';
import { BOLD_ITALIC_STAR, BOLD_ITALIC_UNDERSCORE, BOLD_STAR, BOLD_UNDERSCORE, CHECK_LIST, HEADING, HIGHLIGHT, INLINE_CODE, ITALIC_STAR, ITALIC_UNDERSCORE, ORDERED_LIST, QUOTE, STRIKETHROUGH, UNORDERED_LIST } from './MarkdownTransformers.js';
declare const ELEMENT_TRANSFORMERS: Array<ElementTransformer>;
declare const MULTILINE_ELEMENT_TRANSFORMERS: Array<MultilineElementTransformer>;
declare const TEXT_FORMAT_TRANSFORMERS: Array<TextFormatTransformer>;
declare const TEXT_MATCH_TRANSFORMERS: Array<TextMatchTransformer>;
declare const TRANSFORMERS: Array<Transformer>;
/**
 * Renders markdown from a string. The selection is moved to the start after the operation.
 *
 *  @param {boolean} [shouldPreserveNewLines] By setting this to true, new lines will be preserved between conversions
 *  @param {boolean} [shouldMergeAdjacentLines] By setting this to true, adjacent non empty lines will be merged according to commonmark spec: https://spec.commonmark.org/0.24/#example-177. Not applicable if shouldPreserveNewLines = true.
 */
declare function $convertFromMarkdownString(markdown: string, transformers?: Array<Transformer>, node?: ElementNode, shouldPreserveNewLines?: boolean, shouldMergeAdjacentLines?: boolean): void;
/**
 * Renders string from markdown. The selection is moved to the start after the operation.
 */
declare function $convertToMarkdownString(transformers?: Array<Transformer>, node?: ElementNode, shouldPreserveNewLines?: boolean): string;
export { $convertFromMarkdownString, $convertToMarkdownString, BOLD_ITALIC_STAR, BOLD_ITALIC_UNDERSCORE, BOLD_STAR, BOLD_UNDERSCORE, CHECK_LIST, ELEMENT_TRANSFORMERS, type ElementTransformer, HEADING, HIGHLIGHT, INLINE_CODE, ITALIC_STAR, ITALIC_UNDERSCORE, MULTILINE_ELEMENT_TRANSFORMERS, type MultilineElementTransformer, ORDERED_LIST, QUOTE, registerMarkdownShortcuts, STRIKETHROUGH, TEXT_FORMAT_TRANSFORMERS, TEXT_MATCH_TRANSFORMERS, type TextFormatTransformer, type TextMatchTransformer, type Transformer, TRANSFORMERS, UNORDERED_LIST, };
//# sourceMappingURL=index.d.ts.map