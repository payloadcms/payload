/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { ElementNode } from 'lexical';
import type { TextFormatTransformer, Transformer } from './MarkdownTransformers.js';
export type TextFormatTransformersIndex = Readonly<{
    fullMatchRegExpByTag: Readonly<Record<string, RegExp>>;
    openTagsRegExp: RegExp;
    transformersByTag: Readonly<Record<string, TextFormatTransformer>>;
}>;
/**
 * Renders markdown from a string. The selection is moved to the start after the operation.
 */
export declare function createMarkdownImport(transformers: Array<Transformer>, shouldPreserveNewLines?: boolean): (markdownString: string, node?: ElementNode) => void;
//# sourceMappingURL=MarkdownImport.d.ts.map