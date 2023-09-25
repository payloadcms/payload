/** @module @lexical/link */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { addClassNamesToElement, isHTMLAnchorElement } from '@lexical/utils'
import {
  $applyNodeReplacement,
  $createTextNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type DOMConversionMap,
  type DOMConversionOutput,
  type EditorConfig,
  ElementNode,
  type GridSelection,
  type LexicalCommand,
  type LexicalNode,
  type NodeKey,
  type NodeSelection,
  type RangeSelection,
  type SerializedElementNode,
  type Spread,
  createCommand,
} from 'lexical'

import { type SerializedAutoLinkNode } from './AutoLinkNodeModified'

export interface LinkAttributes {
  doc?: {
    data?: any // Will be populated in afterRead hook
    relationTo: string
    value: string
  } | null
  linkType?: 'custom' | 'internal'
  newTab?: boolean
  nofollow?: boolean
  rel?: null | string
  sponsored?: boolean
  url?: string
}

export type SerializedLinkNode = Spread<
  {
    attributes: LinkAttributes
  },
  SerializedElementNode
>

const SUPPORTED_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'sms:', 'tel:'])

/** @noInheritDoc */
export class LinkNode extends ElementNode {
  __attributes: LinkAttributes

  constructor({
    attributes = {
      doc: null,
      linkType: 'custom',
      newTab: false,
      nofollow: false,
      rel: null,
      sponsored: false,
      url: undefined,
    },
    key,
  }: {
    attributes: LinkAttributes
    key?: NodeKey
  }) {
    super(key)
    this.__attributes = attributes
  }

  static clone(node: LinkNode): LinkNode {
    return new LinkNode({
      attributes: node.__attributes,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'link'
  }

  static importDOM(): DOMConversionMap | null {
    return {
      a: (node: Node) => ({
        conversion: convertAnchorElement,
        priority: 1,
      }),
    }
  }

  static importJSON(serializedNode: SerializedAutoLinkNode): LinkNode {
    const node = $createLinkNode({
      attributes: serializedNode.attributes,
    })
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  canBeEmpty(): false {
    return false
  }

  canInsertTextAfter(): false {
    return false
  }

  canInsertTextBefore(): false {
    return false
  }

  createDOM(config: EditorConfig): HTMLAnchorElement {
    const element = document.createElement('a')
    if (this.__attributes?.linkType === 'custom') {
      element.href = this.sanitizeUrl(this.__attributes.url ?? '')
    }
    if (this.__attributes?.newTab ?? false) {
      element.target = '_blank'
    }

    element.rel = ''

    if (this.__attributes?.newTab === true && this.__attributes?.linkType === 'custom') {
      element.rel = manageRel(element.rel, 'add', 'noopener')
    }

    if (this.__attributes?.sponsored ?? false) {
      element.rel = manageRel(element.rel, 'add', 'sponsored')
    }

    if (this.__attributes?.nofollow ?? false) {
      element.rel = manageRel(element.rel, 'add', 'nofollow')
    }

    if (this.__attributes?.rel !== null) {
      element.rel += ` ${this.__rel}`
    }
    addClassNamesToElement(element, config.theme.link)
    return element
  }

  exportJSON(): SerializedAutoLinkNode {
    return {
      ...super.exportJSON(),
      attributes: this.getAttributes(),
      type: 'link',
      version: 2,
    }
  }

  extractWithChild(
    child: LexicalNode,
    selection: GridSelection | NodeSelection | RangeSelection,
    destination: 'clone' | 'html',
  ): boolean {
    if (!$isRangeSelection(selection)) {
      return false
    }

    const anchorNode = selection.anchor.getNode()
    const focusNode = selection.focus.getNode()

    return (
      this.isParentOf(anchorNode) &&
      this.isParentOf(focusNode) &&
      selection.getTextContent().length > 0
    )
  }

  getAttributes(): LinkAttributes {
    return this.getLatest().__attributes
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true): ElementNode | null {
    const element = this.getParentOrThrow().insertNewAfter(selection, restoreSelection)
    if ($isElementNode(element)) {
      const linkNode = $createLinkNode({ attributes: this.__attributes })
      element.append(linkNode)
      return linkNode
    }
    return null
  }

  isInline(): true {
    return true
  }

  sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url)
      // eslint-disable-next-line no-script-url
      if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
        return 'about:blank'
      }
    } catch (e) {
      return 'https://'
    }
    return url
  }

  setAttributes(attributes: LinkAttributes): void {
    const writable = this.getWritable()
    writable.__attributes = attributes
  }

  updateDOM(prevNode: LinkNode, anchor: HTMLAnchorElement, config: EditorConfig): boolean {
    const url = this.__attributes?.url
    const newTab = this.__attributes?.newTab
    const sponsored = this.__attributes?.sponsored
    const nofollow = this.__attributes?.nofollow
    const rel = this.__attributes?.rel
    if (
      url != null &&
      url !== prevNode.__attributes?.url &&
      this.__attributes?.linkType === 'custom'
    ) {
      anchor.href = url
    }
    if (
      this.__attributes?.linkType === 'internal' &&
      prevNode.__attributes?.linkType === 'custom'
    ) {
      anchor.removeAttribute('href')
    }

    // TODO: not 100% sure why we're settign rel to '' - revisit
    // Start rel config here, then check newTab below
    if (anchor.rel == null) {
      anchor.rel = ''
    }

    if (newTab !== prevNode.__attributes?.newTab) {
      if (newTab ?? false) {
        anchor.target = '_blank'
        if (this.__attributes?.linkType === 'custom') {
          anchor.rel = manageRel(anchor.rel, 'add', 'noopener')
        }
      } else {
        anchor.removeAttribute('target')
        anchor.rel = manageRel(anchor.rel, 'remove', 'noopener')
      }
    }

    if (nofollow !== prevNode.__attributes.nofollow) {
      if (nofollow ?? false) {
        anchor.rel = manageRel(anchor.rel, 'add', 'nofollow')
      } else {
        anchor.rel = manageRel(anchor.rel, 'remove', 'nofollow')
      }
    }

    if (sponsored !== prevNode.__attributes.sponsored) {
      if (sponsored ?? false) {
        anchor.rel = manageRel(anchor.rel, 'add', 'sponsored')
      } else {
        anchor.rel = manageRel(anchor.rel, 'remove', 'sponsored')
      }
    }

    // TODO - revisit - I don't think there can be any other rel
    // values other than nofollow and noopener - so not
    // sure why anchor.rel += rel below
    if (rel !== prevNode.__attributes.rel) {
      if (rel != null) {
        anchor.rel += rel
      } else {
        anchor.removeAttribute('rel')
      }
    }

    return false
  }
}

function convertAnchorElement(domNode: Node): DOMConversionOutput {
  let node: LinkNode | null = null
  if (isHTMLAnchorElement(domNode)) {
    const content = domNode.textContent
    if (content !== null && content !== '') {
      node = $createLinkNode({
        attributes: {
          doc: null,
          linkType: 'custom',
          newTab: domNode.getAttribute('target') === '_blank',
          nofollow: domNode.getAttribute('rel')?.includes('nofollow') ?? false,
          rel: domNode.getAttribute('rel'),
          sponsored: domNode.getAttribute('rel')?.includes('sponsored') ?? false,
          url: domNode.getAttribute('href') ?? '',
        },
      })
    }
  }
  return { node }
}

export function $createLinkNode({ attributes }: { attributes: LinkAttributes }): LinkNode {
  return $applyNodeReplacement(new LinkNode({ attributes }))
}

export function $isLinkNode(node: LexicalNode | null | undefined): node is LinkNode {
  return node instanceof LinkNode
}

export const TOGGLE_LINK_COMMAND: LexicalCommand<LinkAttributes | null> =
  createCommand('TOGGLE_LINK_COMMAND')

export function toggleLink(linkAttributes: LinkAttributes & { text?: string }): void {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) {
    return
  }
  const nodes = selection.extract()

  if (linkAttributes === null) {
    // Remove LinkNodes
    nodes.forEach((node) => {
      const parent = node.getParent()

      if ($isLinkNode(parent)) {
        const children = parent.getChildren()

        for (let i = 0; i < children.length; i += 1) {
          parent.insertBefore(children[i])
        }

        parent.remove()
      }
    })
  } else {
    // Add or merge LinkNodes
    if (nodes.length === 1) {
      const firstNode = nodes[0]
      // if the first node is a LinkNode or if its
      // parent is a LinkNode, we update the URL, target and rel.
      const linkNode: LinkNode | null = $isLinkNode(firstNode)
        ? firstNode
        : $getLinkAncestor(firstNode)
      if (linkNode !== null) {
        linkNode.setAttributes(linkAttributes)

        if (linkAttributes.text != null && linkAttributes.text !== linkNode.getTextContent()) {
          // remove all children and add child with new textcontent:
          linkNode.append($createTextNode(linkAttributes.text))
          linkNode.getChildren().forEach((child) => {
            if (child !== linkNode.getLastChild()) {
              child.remove()
            }
          })
        }
        return
      }
    }

    let prevParent: ElementNode | LinkNode | null = null
    let linkNode: LinkNode | null = null

    nodes.forEach((node) => {
      const parent = node.getParent()

      if (parent === linkNode || parent === null || ($isElementNode(node) && !node.isInline())) {
        return
      }

      if ($isLinkNode(parent)) {
        linkNode = parent
        parent.setAttributes(linkAttributes)
        if (linkAttributes.text != null && linkAttributes.text !== parent.getTextContent()) {
          // remove all children and add child with new textcontent:
          parent.append($createTextNode(linkAttributes.text))
          parent.getChildren().forEach((child) => {
            if (child !== parent.getLastChild()) {
              child.remove()
            }
          })
        }
        return
      }

      if (!parent.is(prevParent)) {
        prevParent = parent
        linkNode = $createLinkNode({ attributes: linkAttributes })

        if ($isLinkNode(parent)) {
          if (node.getPreviousSibling() === null) {
            parent.insertBefore(linkNode)
          } else {
            parent.insertAfter(linkNode)
          }
        } else {
          node.insertBefore(linkNode)
        }
      }

      if ($isLinkNode(node)) {
        if (node.is(linkNode)) {
          return
        }
        if (linkNode !== null) {
          const children = node.getChildren()

          for (let i = 0; i < children.length; i += 1) {
            linkNode.append(children[i])
          }
        }

        node.remove()
        return
      }

      if (linkNode !== null) {
        linkNode.append(node)
      }
    })
  }
}

function $getLinkAncestor(node: LexicalNode): LinkNode | null {
  return $getAncestor(node, (ancestor) => $isLinkNode(ancestor)) as LinkNode
}

function $getAncestor(
  node: LexicalNode,
  predicate: (ancestor: LexicalNode) => boolean,
): LexicalNode | null {
  let parent: LexicalNode | null = node
  while (parent !== null && (parent = parent.getParent()) !== null && !predicate(parent));
  return parent
}

function manageRel(input: string, action: 'add' | 'remove', value: string): string {
  let result: string
  let mutableInput = `${input}`
  if (action === 'add') {
    // if we somehow got out of sync - clean up
    if (mutableInput.includes(value)) {
      const re = new RegExp(value, 'g')
      mutableInput = mutableInput.replace(re, '').trim()
    }
    mutableInput = mutableInput.trim()
    result = mutableInput.length === 0 ? `${value}` : `${mutableInput} ${value}`
  } else {
    const re = new RegExp(value, 'g')
    result = mutableInput.replace(re, '').trim()
  }
  return result
}
