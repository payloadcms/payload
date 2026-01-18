import { type TextNode } from 'lexical';
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { TextFormatTransformersIndex } from './MarkdownImport.js';
import type { TextMatchTransformer } from './MarkdownTransformers.js';
/**
 * Handles applying both text format and text match transformers.
 * It finds the outermost text format or text match and applies it,
 * then recursively calls itself to apply the next outermost transformer,
 * until there are no more transformers to apply.
 */
export declare function importTextTransformers(textNode: TextNode, textFormatTransformersIndex: TextFormatTransformersIndex, textMatchTransformers: Array<TextMatchTransformer>): void;
//# sourceMappingURL=importTextTransformers.d.ts.map