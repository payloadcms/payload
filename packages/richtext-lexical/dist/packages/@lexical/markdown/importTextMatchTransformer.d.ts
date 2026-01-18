import { type TextNode } from 'lexical';
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { TextMatchTransformer } from './MarkdownTransformers.js';
export declare function findOutermostTextMatchTransformer(textNode_: TextNode, textMatchTransformers: Array<TextMatchTransformer>): {
    endIndex: number;
    match: RegExpMatchArray;
    startIndex: number;
    transformer: TextMatchTransformer;
} | null;
export declare function importFoundTextMatchTransformer(textNode: TextNode, startIndex: number, endIndex: number, transformer: TextMatchTransformer, match: RegExpMatchArray): {
    nodeAfter: TextNode | undefined;
    nodeBefore: TextNode | undefined;
    transformedNode?: TextNode;
} | null;
//# sourceMappingURL=importTextMatchTransformer.d.ts.map