/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { TextNode } from 'lexical';
import type { TextFormatTransformersIndex } from './MarkdownImport.js';
import type { TextFormatTransformer } from './MarkdownTransformers.js';
export declare function findOutermostTextFormatTransformer(textNode: TextNode, textFormatTransformersIndex: TextFormatTransformersIndex): {
    endIndex: number;
    match: RegExpMatchArray;
    startIndex: number;
    transformer: TextFormatTransformer;
} | null;
export declare function importTextFormatTransformer(textNode: TextNode, startIndex: number, endIndex: number, transformer: TextFormatTransformer, match: RegExpMatchArray): {
    nodeAfter: TextNode | undefined;
    nodeBefore: TextNode | undefined;
    transformedNode: TextNode;
};
//# sourceMappingURL=importTextFormatTransformer.d.ts.map