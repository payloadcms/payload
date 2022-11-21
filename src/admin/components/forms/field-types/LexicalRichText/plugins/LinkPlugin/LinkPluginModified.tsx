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


export type LinkAttributes = {
  newTab?: null | boolean;
};

export type PayloadLinkData = {
  payloadType: string,
  url: string,
  linkType: string,
  newTab: boolean|undefined,
  doc: {
    value: string,
    relationTo: string
  }|undefined,
  fields?,
};

export type SerializedLinkNode = Spread<{
  type: 'link';
  url: string;
  linkType: string;
  version: 1;
},
  Spread<LinkAttributes, SerializedElementNode>>;

/** @noInheritDoc */
export class LinkNode extends ElementNode {
  /** @internal */
  __url: string;

  /** @internal */
  __linkType: string;

  /** @internal */
  __newTab: null | boolean;

  static getType(): string {
    return 'link';
  }

  static clone(node: LinkNode): LinkNode {
    return new LinkNode(
      node.__url,
      node.__linkType,
      {
        newTab: node.__newTab,
      },
      node.__key,
    );
  }

  constructor(url: string, linkType: string, attributes: LinkAttributes = {}, key?: NodeKey) {
    super(key);
    const {
      newTab = null,
    } = attributes;
    this.__url = url;
    this.__linkType = linkType;
    this.__newTab = newTab;
  }

  createDOM(config: EditorConfig): HTMLAnchorElement {
    const element = document.createElement('a');
    element.href = this.__url;
    if (this.__newTab) {
      element.target = '_blank';
    }
    if (this.__rel !== null) {
      element.rel = this.__rel; // TODO
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
    const target = this.__newTab ? '_blank' : null;
    // const rel = this.__rel;
    if (url !== prevNode.__url) {
      anchor.href = url;
    }

    if (target !== prevNode.__target) {
      if (target) {
        anchor.target = target;
      } else {
        anchor.removeAttribute('target');
      }
    }

    /* if (rel !== prevNode.__rel) {
      if (rel) {
        anchor.rel = rel;
      } else {
        anchor.removeAttribute('rel');
      }
    } */
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
    const node = $createLinkNode(serializedNode.url, serializedNode.linkType, {
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
      newTab: this.isNewTab(),
      type: 'link',
      linkType: this.getLinkType(),
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

  getLinkType(): string {
    return this.getLatest().__linkType;
  }

  setLinkType(linkType: string): void {
    const writable = this.getWritable();
    writable.__linkType = linkType;
  }

  isNewTab(): null | boolean {
    return this.getLatest().__newTab;
  }

  setNewTab(newTab: null | boolean): void {
    const writable = this.getWritable();
    writable.__newTab = newTab;
  }

  /* getRel(): null | string {
    return this.getLatest().__rel;
  }

  setRel(rel: null | string): void {
    const writable = this.getWritable();
    writable.__rel = rel;
  } */

  insertNewAfter(selection: RangeSelection): null | ElementNode {
    const element = this.getParentOrThrow()
      .insertNewAfter(selection);
    if ($isElementNode(element)) {
      const linkNode = $createLinkNode(this.__url, this.__linkType, {
        newTab: this.__newTab,
      });
      element.append(linkNode);
      return linkNode;
    }
    return null;
  }

  static canInsertTextBefore(): false {
    return false;
  }

  static canInsertTextAfter(): false {
    return false;
  }

  static canBeEmpty(): false {
    return false;
  }

  static isInline(): true {
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
      node = $createLinkNode(domNode.getAttribute('href') || '', 'custom', {
        newTab: domNode.getAttribute('target') === '_blank' ? true : null,
      });
    }
  }
  return { node };
}

export function $createLinkNode(
  url: string,
  linkType: string,
  attributes?: LinkAttributes,
): LinkNode {
  return new LinkNode(url, linkType, attributes);
}

export function $isLinkNode(
  node: LexicalNode | null | undefined,
): node is LinkNode {
  return node instanceof LinkNode;
}

export type SerializedAutoLinkNode = Spread<{
  type: 'autolink';
  version: 1;
},
  SerializedLinkNode>;

// Custom node type to override `canInsertTextAfter` that will
// allow typing within the link
export class AutoLinkNode extends LinkNode {
  static getType(): string {
    return 'autolink';
  }

  static clone(node: AutoLinkNode): AutoLinkNode {
    return new AutoLinkNode(
      node.__url,
      node.__linkType,
      {
        newTab: node.__newTab,
      },
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedAutoLinkNode): AutoLinkNode {
    const node = $createAutoLinkNode(serializedNode.url, serializedNode.linkType, {
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
    const element = this.getParentOrThrow()
      .insertNewAfter(selection);
    if ($isElementNode(element)) {
      const linkNode = $createAutoLinkNode(this.__url, this.__linkType, {
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
  linkType: string,
  attributes?: LinkAttributes,
): AutoLinkNode {
  return new AutoLinkNode(url, linkType, attributes);
}

export function $isAutoLinkNode(
  node: LexicalNode | null | undefined,
): node is AutoLinkNode {
  return node instanceof AutoLinkNode;
}

export const TOGGLE_LINK_COMMAND: LexicalCommand<string | ({ url: string, linkType: string } & LinkAttributes) | PayloadLinkData | null> = createCommand('TOGGLE_LINK_COMMAND');

export function toggleLink(
  url: null | string,
  attributes: LinkAttributes = {},
): void {
  const {
    newTab,
  } = attributes;
  const selection = $getSelection();

  const linkType = 'custom';

  if (!$isRangeSelection(selection)) {
    return;
  }
  const nodes = selection.extract();

  if (url === null) {
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
        linkNode.setURL(url);
        linkNode.setLinkType(linkType);
        linkNode.setNewTab(newTab);
        /* if (rel !== undefined) {
          linkNode.setRel(rel);
        } */
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
        parent.setURL(url);
        parent.setLinkType(linkType);
        parent.setNewTab(newTab);
        /* if (rel !== undefined) {
          parent.setRel(rel);
        } */
        return;
      }

      if (!parent.is(prevParent)) {
        prevParent = parent;
        linkNode = $createLinkNode(url, linkType, {
          newTab,
        });

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

export function toggleLinkPayload( // TODO: Do for docs
  payloadLinkData: PayloadLinkData,
): void {
  const linkType = 'internal';

  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return;
  }
  const nodes = selection.extract();

  if (payloadLinkData.url === null) {
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
        linkNode.setURL(payloadLinkData.url);
        linkNode.setLinkType(linkType);
        linkNode.setNewTab(payloadLinkData.newTab);
        /* if (rel !== undefined) {
          linkNode.setRel(rel);
        } */
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
        parent.setURL(payloadLinkData.url);
        parent.setLinkType(linkType);
        parent.setNewTab(payloadLinkData.newTab);
        /* if (rel !== undefined) {
          parent.setRel(rel);
        } */
        return;
      }

      if (!parent.is(prevParent)) {
        prevParent = parent;
        linkNode = $createLinkNode(payloadLinkData.url, 'internal', {
          newTab: payloadLinkData.newTab,
        });

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
  ) {

  }
  return parent;
}
