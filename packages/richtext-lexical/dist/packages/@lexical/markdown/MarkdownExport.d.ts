/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { ElementNode } from 'lexical';
import type { Transformer } from './MarkdownTransformers.js';
/**
 * Renders string from markdown. The selection is moved to the start after the operation.
 */
export declare function createMarkdownExport(transformers: Array<Transformer>, shouldPreserveNewLines?: boolean): (node?: ElementNode) => string;
//# sourceMappingURL=MarkdownExport.d.ts.map