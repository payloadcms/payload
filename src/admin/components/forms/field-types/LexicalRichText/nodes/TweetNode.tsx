/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
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
import {useCallback, useEffect, useRef, useState} from 'react';

const WIDGET_SCRIPT_URL = 'https://platform.twitter.com/widgets.js';

type TweetComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  loadingComponent?: JSX.Element | string;
  nodeKey: NodeKey;
  onError?: (error: string) => void;
  onLoad?: () => void;
  tweetID: string;
}>;

function convertTweetElement(
  domNode: HTMLDivElement,
): DOMConversionOutput | null {
  const id = domNode.getAttribute('data-lexical-tweet-id');
  if (id) {
    const node = $createTweetNode(id);
    return {node};
  }
  return null;
}

let isTwitterScriptLoading = true;

function TweetComponent({
  className,
  format,
  loadingComponent,
  nodeKey,
  onError,
  onLoad,
  tweetID,
}: TweetComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const previousTweetIDRef = useRef<string>('');
  const [isTweetLoading, setIsTweetLoading] = useState(false);

  const createTweet = useCallback(async () => {
    try {
      // @ts-expect-error Twitter is attached to the window.
      await window.twttr.widgets.createTweet(tweetID, containerRef.current);

      setIsTweetLoading(false);
      isTwitterScriptLoading = false;

      if (onLoad) {
        onLoad();
      }
    } catch (error) {
      if (onError) {
        onError(String(error));
      }
    }
  }, [onError, onLoad, tweetID]);

  useEffect(() => {
    if (tweetID !== previousTweetIDRef.current) {
      setIsTweetLoading(true);

      if (isTwitterScriptLoading) {
        const script = document.createElement('script');
        script.src = WIDGET_SCRIPT_URL;
        script.async = true;
        document.body?.appendChild(script);
        script.onload = createTweet;
        if (onError) {
          script.onerror = onError as OnErrorEventHandler;
        }
      } else {
        createTweet();
      }

      if (previousTweetIDRef) {
        previousTweetIDRef.current = tweetID;
      }
    }
  }, [createTweet, onError, tweetID]);

  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      {isTweetLoading ? loadingComponent : null}
      <div
        style={{display: 'inline-block', width: '550px'}}
        ref={containerRef}
      />
    </BlockWithAlignableContents>
  );
}

export type SerializedTweetNode = Spread<
  {
    id: string;
    type: 'tweet';
    version: 1;
  },
  SerializedDecoratorBlockNode
>;

export class TweetNode extends DecoratorBlockNode {
  __id: string;

  static getType(): string {
    return 'tweet';
  }

  static clone(node: TweetNode): TweetNode {
    return new TweetNode(node.__id, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedTweetNode): TweetNode {
    const node = $createTweetNode(serializedNode.id);
    node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON(): SerializedTweetNode {
    return {
      ...super.exportJSON(),
      id: this.getId(),
      type: 'tweet',
      version: 1,
    };
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {
      div: (domNode: HTMLDivElement) => {
        if (!domNode.hasAttribute('data-lexical-tweet-id')) {
          return null;
        }
        return {
          conversion: convertTweetElement,
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-tweet-id', this.__id);
    const text = document.createTextNode(this.getTextContent());
    element.append(text);
    return {element};
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__id = id;
  }

  getId(): string {
    return this.__id;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return `https://twitter.com/i/web/status/${this.__id}`;
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <TweetComponent
        className={className}
        format={this.__format}
        loadingComponent="Loading..."
        nodeKey={this.getKey()}
        tweetID={this.__id}
      />
    );
  }

  isInline(): false {
    return false;
  }
}

export function $createTweetNode(tweetID: string): TweetNode {
  return new TweetNode(tweetID);
}

export function $isTweetNode(
  node: TweetNode | LexicalNode | null | undefined,
): node is TweetNode {
  return node instanceof TweetNode;
}
