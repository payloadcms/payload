/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  EditorConfig,
  LexicalNode,
  SerializedTextNode,
  Spread,
} from 'lexical';

import {TextNode} from 'lexical';

export type SerializedKeywordNode = Spread<
  {
    type: 'keyword';
    version: 1;
  },
  SerializedTextNode
>;

export class KeywordNode extends TextNode {
  static getType(): string {
    return 'keyword';
  }

  static clone(node: KeywordNode): KeywordNode {
    return new KeywordNode(node.__text, node.__key);
  }

  static importJSON(serializedNode: SerializedKeywordNode): KeywordNode {
    const node = $createKeywordNode(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedKeywordNode {
    return {
      ...super.exportJSON(),
      type: 'keyword',
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.style.cursor = 'default';
    dom.className = 'keyword';
    return dom;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  isTextEntity(): true {
    return true;
  }
}

export function $createKeywordNode(keyword: string): KeywordNode {
  return new KeywordNode(keyword);
}

export function $isKeywordNode(
  node: LexicalNode | null | undefined | undefined,
): boolean {
  return node instanceof KeywordNode;
}
