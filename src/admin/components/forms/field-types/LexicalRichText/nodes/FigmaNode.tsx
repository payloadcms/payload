/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';

import {BlockWithAlignableContents} from '@lexical/react/LexicalBlockWithAlignableContents';
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import * as React from 'react';

type FigmaComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  documentID: string;
}>;

function FigmaComponent({
  className,
  format,
  nodeKey,
  documentID,
}: FigmaComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <iframe
        width="560"
        height="315"
        src={`https://www.figma.com/embed?embed_host=lexical&url=\
        https://www.figma.com/file/${documentID}`}
        allowFullScreen={true}
      />
    </BlockWithAlignableContents>
  );
}

export type SerializedFigmaNode = Spread<
  {
    documentID: string;
    type: 'figma';
    version: 1;
  },
  SerializedDecoratorBlockNode
>;

export class FigmaNode extends DecoratorBlockNode {
  __id: string;

  static getType(): string {
    return 'figma';
  }

  static clone(node: FigmaNode): FigmaNode {
    return new FigmaNode(node.__id, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedFigmaNode): FigmaNode {
    const node = $createFigmaNode(serializedNode.documentID);
    node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON(): SerializedFigmaNode {
    return {
      ...super.exportJSON(),
      documentID: this.__id,
      type: 'figma',
      version: 1,
    };
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__id = id;
  }

  updateDOM(): false {
    return false;
  }

  getId(): string {
    return this.__id;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return `https://www.figma.com/file/${this.__id}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <FigmaComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        documentID={this.__id}
      />
    );
  }

  isInline(): false {
    return false;
  }
}

export function $createFigmaNode(documentID: string): FigmaNode {
  return new FigmaNode(documentID);
}

export function $isFigmaNode(
  node: FigmaNode | LexicalNode | null | undefined,
): node is FigmaNode {
  return node instanceof FigmaNode;
}
