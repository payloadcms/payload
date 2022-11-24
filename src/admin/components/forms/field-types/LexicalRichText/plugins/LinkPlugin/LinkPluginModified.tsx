/** @module @lexical/link */
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
  EditorConfig,
  GridSelection,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  NodeSelection,
  RangeSelection,
  SerializedElementNode,
} from 'lexical';

import { addClassNamesToElement } from '@lexical/utils';
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  createCommand,
  ElementNode,
  Spread,
} from 'lexical';

// This is just what's passed in the command - not what's used as attributes in the final link
export type PayloadLinkData = {
  payloadType?: string,
  url: string|null,
  linkType: 'custom'|'internal',
  newTab: boolean,
  doc: {
    value: string,
    relationTo: string
  }|null,
  fields?,
};

export type LinkAttributes = {
  rel?: null | string;
  newTab?: boolean;
};

export type SerializedLinkNode = Spread<
  {
    type: 'link';
    url: string;
    version: 1;
  },
  Spread<LinkAttributes, SerializedElementNode>
  >;

/** @noInheritDoc */
export class LinkNode extends ElementNode {
  /** @internal */
  __url: string;

  /** @internal */
  __newTab: boolean;

  /** @internal */
  __rel: null | string;

  static getType(): string {
    return 'link';
  }

  static clone(node: LinkNode): LinkNode {
    return new LinkNode(
      node.__url,
      { rel: node.__rel, newTab: node.__newTab },
      node.__key,
    );
  }

  constructor(url: string, attributes: LinkAttributes = {}, key?: NodeKey) {
    super(key);
    const { newTab = false, rel = null } = attributes;
    this.__url = url;
    this.__newTab = newTab;
    this.__rel = rel;
  }

  createDOM(config: EditorConfig): HTMLAnchorElement {
    const element = document.createElement('a');
    element.href = this.__url;
    if (this.__newTab) {
      element.target = '_blank';
    }

    if (this.__rel !== null) {
      element.rel = this.__rel;
    }
    addClassNamesToElement(element, config.theme.link);
    return element;
  }

  updateDOM(
    prevNode: LinkNode,
    anchor: HTMLAnchorElement,
    config: EditorConfig,
  ): boolean {
    const url = this.__url;
    const newTab = this.__newTab;
    const rel = this.__rel;
    if (url !== prevNode.__url) {
      anchor.href = url;
    }

    if (newTab !== prevNode.__newTab) {
      if (newTab) {
        anchor.target = '_blank';
      } else {
        anchor.removeAttribute('target');
      }
    }

    if (rel !== prevNode.__rel) {
      if (rel) {
        anchor.rel = rel;
      } else {
        anchor.removeAttribute('rel');
      }
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      a: (node: Node) => ({
        conversion: convertAnchorElement,
        priority: 1,
      }),
    };
  }

  static importJSON(
    serializedNode: SerializedLinkNode | SerializedAutoLinkNode,
  ): LinkNode {
    const node = $createLinkNode(serializedNode.url, {
      rel: serializedNode.rel,
      newTab: serializedNode.newTab,
    });
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedLinkNode | SerializedAutoLinkNode {
    return {
      ...super.exportJSON(),
      rel: this.getRel(),
      newTab: this.isNewTab(),
      type: 'link',
      url: this.getURL(),
      version: 1,
    };
  }

  getURL(): string {
    return this.getLatest().__url;
  }

  setURL(url: string): void {
    const writable = this.getWritable();
    writable.__url = url;
  }

  isNewTab(): boolean {
    return this.getLatest().__newTab;
  }

  setNewTab(newTab: boolean): void {
    const writable = this.getWritable();
    writable.__newTab = newTab;
  }

  getRel(): null | string {
    return this.getLatest().__rel;
  }

  setRel(rel: null | string): void {
    const writable = this.getWritable();
    writable.__rel = rel;
  }

  insertNewAfter(selection: RangeSelection): null | ElementNode {
    const element = this.getParentOrThrow().insertNewAfter(selection);
    if ($isElementNode(element)) {
      const linkNode = $createLinkNode(this.__url, {
        rel: this.__rel,
        newTab: this.__newTab,
      });
      element.append(linkNode);
      return linkNode;
    }
    return null;
  }

  canInsertTextBefore(): false {
    return false;
  }

  canInsertTextAfter(): false {
    return false;
  }

  canBeEmpty(): false {
    return false;
  }

  isInline(): true {
    return true;
  }

  extractWithChild(
    child: LexicalNode,
    selection: RangeSelection | NodeSelection | GridSelection,
    destination: 'clone' | 'html',
  ): boolean {
    if (!$isRangeSelection(selection)) {
      return false;
    }

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    return (
      this.isParentOf(anchorNode)
      && this.isParentOf(focusNode)
      && selection.getTextContent().length > 0
    );
  }
}

function convertAnchorElement(domNode: Node): DOMConversionOutput {
  let node = null;
  if (domNode instanceof HTMLAnchorElement) {
    const content = domNode.textContent;
    if (content !== null && content !== '') {
      node = $createLinkNode(domNode.getAttribute('href') || '', {
        rel: domNode.getAttribute('rel'),
        newTab: domNode.getAttribute('target') === '_blank',
      });
    }
  }
  return { node };
}

export function $createLinkNode(
  url: string,
  attributes?: LinkAttributes,
): LinkNode {
  return new LinkNode(url, attributes);
}

export function $isLinkNode(
  node: LexicalNode | null | undefined,
): node is LinkNode {
  return node instanceof LinkNode;
}

export type SerializedAutoLinkNode = Spread<
  {
    type: 'autolink';
    version: 1;
  },
  SerializedLinkNode
  >;

// Custom node type to override `canInsertTextAfter` that will
// allow typing within the link
export class AutoLinkNode extends LinkNode {
  static getType(): string {
    return 'autolink';
  }

  static clone(node: AutoLinkNode): AutoLinkNode {
    return new AutoLinkNode(
      node.__url,
      { rel: node.__rel, newTab: node.__newTab },
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedAutoLinkNode): AutoLinkNode {
    const node = $createAutoLinkNode(serializedNode.url, {
      rel: serializedNode.rel,
      newTab: serializedNode.newTab,
    });
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  static importDOM(): null {
    // TODO: Should link node should handle the import over autolink?
    return null;
  }

  exportJSON(): SerializedAutoLinkNode {
    return {
      ...super.exportJSON(),
      type: 'autolink',
      version: 1,
    };
  }

  insertNewAfter(selection: RangeSelection): null | ElementNode {
    const element = this.getParentOrThrow().insertNewAfter(selection);
    if ($isElementNode(element)) {
      const linkNode = $createAutoLinkNode(this.__url, {
        rel: this.__rel,
        newTab: this.__newTab,
      });
      element.append(linkNode);
      return linkNode;
    }
    return null;
  }
}

export function $createAutoLinkNode(
  url: string,
  attributes?: LinkAttributes,
): AutoLinkNode {
  return new AutoLinkNode(url, attributes);
}

export function $isAutoLinkNode(
  node: LexicalNode | null | undefined,
): node is AutoLinkNode {
  return node instanceof AutoLinkNode;
}

export const TOGGLE_LINK_COMMAND: LexicalCommand<
  string | ({url: string} & LinkAttributes) | null
  > = createCommand('TOGGLE_LINK_COMMAND');

export function toggleLink(
  linkData: PayloadLinkData,
): void {
  const rel = 'noopener'; /* attributes.rel === undefined ? 'noopener' : attributes.rel; */
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return;
  }
  const nodes = selection.extract();

  if (linkData === null) {
    // Remove LinkNodes
    nodes.forEach((node) => {
      const parent = node.getParent();

      if ($isLinkNode(parent)) {
        const children = parent.getChildren();

        for (let i = 0; i < children.length; i += 1) {
          parent.insertBefore(children[i]);
        }

        parent.remove();
      }
    });
  } else {
    // Add or merge LinkNodes
    if (nodes.length === 1) {
      const firstNode = nodes[0];
      // if the first node is a LinkNode or if its
      // parent is a LinkNode, we update the URL, target and rel.
      const linkNode = $isLinkNode(firstNode)
        ? firstNode
        : $getLinkAncestor(firstNode);
      if (linkNode !== null) {
        linkNode.setURL(linkData.url);
        linkNode.setNewTab(linkData.newTab);

        if (rel !== null) {
          linkNode.setRel(rel);
        }
        return;
      }
    }

    let prevParent: ElementNode | LinkNode | null = null;
    let linkNode: LinkNode | null = null;

    nodes.forEach((node) => {
      const parent = node.getParent();

      if (
        parent === linkNode
        || parent === null
        || ($isElementNode(node) && !node.isInline())
      ) {
        return;
      }

      if ($isLinkNode(parent)) {
        linkNode = parent;
        parent.setURL(linkData.url);
        parent.setNewTab(linkData.newTab);

        if (rel !== null) {
          linkNode.setRel(rel);
        }
        return;
      }

      if (!parent.is(prevParent)) {
        prevParent = parent;
        linkNode = $createLinkNode(linkData.url, { rel, newTab: linkData.newTab });

        if ($isLinkNode(parent)) {
          if (node.getPreviousSibling() === null) {
            parent.insertBefore(linkNode);
          } else {
            parent.insertAfter(linkNode);
          }
        } else {
          node.insertBefore(linkNode);
        }
      }

      if ($isLinkNode(node)) {
        if (node.is(linkNode)) {
          return;
        }
        if (linkNode !== null) {
          const children = node.getChildren();

          for (let i = 0; i < children.length; i += 1) {
            linkNode.append(children[i]);
          }
        }

        node.remove();
        return;
      }

      if (linkNode !== null) {
        linkNode.append(node);
      }
    });
  }
}

function $getLinkAncestor(node: LexicalNode): null | LexicalNode {
  return $getAncestor(node, (ancestor) => $isLinkNode(ancestor));
}

function $getAncestor(
  node: LexicalNode,
  predicate: (ancestor: LexicalNode) => boolean,
): null | LexicalNode {
  let parent: null | LexicalNode = node;
  while (
    parent !== null
    && (parent = parent.getParent()) !== null
    && !predicate(parent)
  );
  return parent;
}
