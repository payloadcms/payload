'use client'
import type { ElementNode, LexicalEditor, LexicalNode, TextNode } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { mergeRegister } from '@lexical/utils'
import {
  $createTextNode,
  $getSelection,
  $isElementNode,
  $isLineBreakNode,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  TextNode as TextNodeValue,
} from 'lexical'
import { useEffect } from 'react'

import type { PluginComponent } from '../../../../typesClient.js'
import type { LinkFields } from '../../../nodes/types.js'
import type { ClientProps } from '../../index.js'

import { $createAutoLinkNode, $isAutoLinkNode, AutoLinkNode } from '../../../nodes/AutoLinkNode.js'
import { $isLinkNode } from '../../../nodes/LinkNode.js'

type ChangeHandler = (url: null | string, prevUrl: null | string) => void

interface LinkMatcherResult {
  fields?: LinkFields
  index: number
  length: number
  text: string
  url: string
}

export type LinkMatcher = (text: string) => LinkMatcherResult | null

export function createLinkMatcherWithRegExp(
  regExp: RegExp,
  urlTransformer: (text: string) => string = (text) => text,
) {
  return (text: string) => {
    const match = regExp.exec(text)
    if (match === null) {
      return null
    }
    return {
      index: match.index,
      length: match[0].length,
      text: match[0],
      url: urlTransformer(match[0]),
    }
  }
}

function findFirstMatch(text: string, matchers: LinkMatcher[]): LinkMatcherResult | null {
  for (const matcher of matchers) {
    const match = matcher(text)

    if (match != null) {
      return match
    }
  }

  return null
}

const PUNCTUATION_OR_SPACE = /[.,;\s]/

function isSeparator(char: string | undefined): boolean {
  return char !== undefined && PUNCTUATION_OR_SPACE.test(char)
}

function endsWithSeparator(textContent: string): boolean {
  return isSeparator(textContent[textContent.length - 1])
}

function startsWithSeparator(textContent: string): boolean {
  return isSeparator(textContent[0])
}

/**
 * Check if the text content starts with a fullstop followed by a top-level domain.
 * Meaning if the text content can be a beginning of a top level domain.
 * @param textContent
 * @param isEmail
 * @returns boolean
 */
function startsWithTLD(textContent: string, isEmail: boolean): boolean {
  if (isEmail) {
    return /^\.[a-z]{2,}/i.test(textContent)
  } else {
    return /^\.[a-z0-9]+/i.test(textContent)
  }
}

function isPreviousNodeValid(node: LexicalNode): boolean {
  let previousNode = node.getPreviousSibling()
  if ($isElementNode(previousNode)) {
    previousNode = previousNode.getLastDescendant()
  }
  return (
    previousNode === null ||
    $isLineBreakNode(previousNode) ||
    ($isTextNode(previousNode) && endsWithSeparator(previousNode.getTextContent()))
  )
}

function isNextNodeValid(node: LexicalNode): boolean {
  let nextNode = node.getNextSibling()
  if ($isElementNode(nextNode)) {
    nextNode = nextNode.getFirstDescendant()
  }
  return (
    nextNode === null ||
    $isLineBreakNode(nextNode) ||
    ($isTextNode(nextNode) && startsWithSeparator(nextNode.getTextContent()))
  )
}

function isContentAroundIsValid(
  matchStart: number,
  matchEnd: number,
  text: string,
  nodes: TextNode[],
): boolean {
  const contentBeforeIsValid =
    matchStart > 0 ? isSeparator(text[matchStart - 1]) : isPreviousNodeValid(nodes[0]!)
  if (!contentBeforeIsValid) {
    return false
  }

  const contentAfterIsValid =
    matchEnd < text.length ? isSeparator(text[matchEnd]) : isNextNodeValid(nodes[nodes.length - 1]!)
  return contentAfterIsValid
}

function extractMatchingNodes(
  nodes: TextNode[],
  startIndex: number,
  endIndex: number,
): [
  matchingOffset: number,
  unmodifiedBeforeNodes: TextNode[],
  matchingNodes: TextNode[],
  unmodifiedAfterNodes: TextNode[],
] {
  const unmodifiedBeforeNodes: TextNode[] = []
  const matchingNodes: TextNode[] = []
  const unmodifiedAfterNodes: TextNode[] = []
  let matchingOffset = 0

  let currentOffset = 0
  const currentNodes = [...nodes]

  while (currentNodes.length > 0) {
    const currentNode = currentNodes[0]!
    const currentNodeText = currentNode.getTextContent()
    const currentNodeLength = currentNodeText.length
    const currentNodeStart = currentOffset
    const currentNodeEnd = currentOffset + currentNodeLength

    if (currentNodeEnd <= startIndex) {
      unmodifiedBeforeNodes.push(currentNode)
      matchingOffset += currentNodeLength
    } else if (currentNodeStart >= endIndex) {
      unmodifiedAfterNodes.push(currentNode)
    } else {
      matchingNodes.push(currentNode)
    }
    currentOffset += currentNodeLength
    currentNodes.shift()
  }
  return [matchingOffset, unmodifiedBeforeNodes, matchingNodes, unmodifiedAfterNodes]
}

function $createAutoLinkNode_(
  nodes: TextNode[],
  startIndex: number,
  endIndex: number,
  match: LinkMatcherResult,
): TextNode | undefined {
  const fields = {
    linkType: 'custom',
    url: match.url,
    ...match.fields,
  } as LinkFields

  const linkNode = $createAutoLinkNode({ fields })
  if (nodes.length === 1) {
    const remainingTextNode = nodes[0]!
    let linkTextNode: TextNode | undefined
    if (startIndex === 0) {
      ;[linkTextNode] = remainingTextNode.splitText(endIndex)
    } else {
      ;[, linkTextNode] = remainingTextNode.splitText(startIndex, endIndex)
    }
    if (linkTextNode) {
      const textNode = $createTextNode(match.text)
      textNode.setFormat(linkTextNode.getFormat())
      textNode.setDetail(linkTextNode.getDetail())
      textNode.setStyle(linkTextNode.getStyle())
      linkNode.append(textNode)
      linkTextNode.replace(linkNode)
    }
    return remainingTextNode
  } else if (nodes.length > 1) {
    const firstTextNode = nodes[0]!
    let offset = firstTextNode.getTextContent().length
    let firstLinkTextNode
    if (startIndex === 0) {
      firstLinkTextNode = firstTextNode
    } else {
      ;[, firstLinkTextNode] = firstTextNode.splitText(startIndex)
    }
    const linkNodes: LexicalNode[] = []
    let remainingTextNode
    nodes.forEach((currentNode) => {
      const currentNodeText = currentNode.getTextContent()
      const currentNodeLength = currentNodeText.length
      const currentNodeStart = offset
      const currentNodeEnd = offset + currentNodeLength
      if (currentNodeStart < endIndex) {
        if (currentNodeEnd <= endIndex) {
          linkNodes.push(currentNode)
        } else {
          const [linkTextNode, endNode] = currentNode.splitText(endIndex - currentNodeStart)
          if (linkTextNode) {
            linkNodes.push(linkTextNode)
          }
          remainingTextNode = endNode
        }
      }
      offset += currentNodeLength
    })

    if (firstLinkTextNode) {
      const selection = $getSelection()
      const selectedTextNode = selection ? selection.getNodes().find($isTextNode) : undefined
      const textNode = $createTextNode(firstLinkTextNode.getTextContent())
      textNode.setFormat(firstLinkTextNode.getFormat())
      textNode.setDetail(firstLinkTextNode.getDetail())
      textNode.setStyle(firstLinkTextNode.getStyle())
      linkNode.append(textNode, ...linkNodes)
      // it does not preserve caret position if caret was at the first text node
      // so we need to restore caret position
      if (selectedTextNode && selectedTextNode === firstLinkTextNode) {
        if ($isRangeSelection(selection)) {
          textNode.select(selection.anchor.offset, selection.focus.offset)
        } else if ($isNodeSelection(selection)) {
          textNode.select(0, textNode.getTextContent().length)
        }
      }
      firstLinkTextNode.replace(linkNode)
      return remainingTextNode
    }
  }
  return undefined
}

function $handleLinkCreation(
  nodes: TextNode[],
  matchers: LinkMatcher[],
  onChange: ChangeHandler,
): void {
  let currentNodes = [...nodes]
  const initialText = currentNodes.map((node) => node.getTextContent()).join('')
  let text = initialText

  let match
  let invalidMatchEnd = 0

  while ((match = findFirstMatch(text, matchers)) != null && match !== null) {
    const matchStart: number = match.index
    const matchLength: number = match.length
    const matchEnd = matchStart + matchLength
    const isValid = isContentAroundIsValid(
      invalidMatchEnd + matchStart,
      invalidMatchEnd + matchEnd,
      initialText,
      currentNodes,
    )

    if (isValid) {
      const [matchingOffset, , matchingNodes, unmodifiedAfterNodes] = extractMatchingNodes(
        currentNodes,
        invalidMatchEnd + matchStart,
        invalidMatchEnd + matchEnd,
      )

      const actualMatchStart = invalidMatchEnd + matchStart - matchingOffset
      const actualMatchEnd = invalidMatchEnd + matchEnd - matchingOffset
      const remainingTextNode = $createAutoLinkNode_(
        matchingNodes,
        actualMatchStart,
        actualMatchEnd,
        match,
      )
      currentNodes = remainingTextNode
        ? [remainingTextNode, ...unmodifiedAfterNodes]
        : unmodifiedAfterNodes
      onChange(match.url, null)
      invalidMatchEnd = 0
    } else {
      invalidMatchEnd += matchEnd
    }

    text = text.substring(matchEnd)
  }
}

function handleLinkEdit(
  linkNode: AutoLinkNode,
  matchers: LinkMatcher[],
  onChange: ChangeHandler,
): void {
  // Check children are simple text
  const children = linkNode.getChildren()
  const childrenLength = children.length
  for (let i = 0; i < childrenLength; i++) {
    const child = children[i]
    if (!$isTextNode(child) || !child.isSimpleText()) {
      replaceWithChildren(linkNode)
      onChange(null, linkNode.getFields()?.url ?? null)
      return
    }
  }

  // Check text content fully matches
  const text = linkNode.getTextContent()
  const match = findFirstMatch(text, matchers)
  if (match === null || match.text !== text) {
    replaceWithChildren(linkNode)
    onChange(null, linkNode.getFields()?.url ?? null)
    return
  }

  // Check neighbors
  if (!isPreviousNodeValid(linkNode) || !isNextNodeValid(linkNode)) {
    replaceWithChildren(linkNode)
    onChange(null, linkNode.getFields()?.url ?? null)
    return
  }

  const url = linkNode.getFields()?.url
  if (url !== match?.url) {
    const flds = linkNode.getFields()
    flds.url = match?.url
    linkNode.setFields(flds)
    onChange(match.url, url ?? null)
  }
}

// Bad neighbors are edits in neighbor nodes that make AutoLinks incompatible.
// Given the creation preconditions, these can only be simple text nodes.
function handleBadNeighbors(
  textNode: TextNode,
  matchers: LinkMatcher[],
  onChange: ChangeHandler,
): void {
  const previousSibling = textNode.getPreviousSibling()
  const nextSibling = textNode.getNextSibling()
  const text = textNode.getTextContent()

  if ($isAutoLinkNode(previousSibling)) {
    const isEmailURI = previousSibling.getFields()?.url
      ? (previousSibling.getFields()?.url?.startsWith('mailto:') ?? false)
      : false
    if (!startsWithSeparator(text) || startsWithTLD(text, isEmailURI)) {
      previousSibling.append(textNode)
      handleLinkEdit(previousSibling, matchers, onChange)
      onChange(null, previousSibling.getFields()?.url ?? null)
    }
  }

  if ($isAutoLinkNode(nextSibling) && !endsWithSeparator(text)) {
    replaceWithChildren(nextSibling)
    handleLinkEdit(nextSibling, matchers, onChange)
    onChange(null, nextSibling.getFields()?.url ?? null)
  }
}

function replaceWithChildren(node: ElementNode): LexicalNode[] {
  const children = node.getChildren()
  const childrenLength = children.length

  for (let j = childrenLength - 1; j >= 0; j--) {
    node.insertAfter(children[j]!)
  }

  node.remove()
  return children.map((child) => child.getLatest())
}

function getTextNodesToMatch(textNode: TextNode): TextNode[] {
  // check if next siblings are simple text nodes till a node contains a space separator
  const textNodesToMatch = [textNode]
  let nextSibling = textNode.getNextSibling()
  while (nextSibling !== null && $isTextNode(nextSibling) && nextSibling.isSimpleText()) {
    textNodesToMatch.push(nextSibling)
    if (/\s/.test(nextSibling.getTextContent())) {
      break
    }
    nextSibling = nextSibling.getNextSibling()
  }
  return textNodesToMatch
}

function useAutoLink(
  editor: LexicalEditor,
  matchers: LinkMatcher[],
  onChange?: ChangeHandler,
): void {
  useEffect(() => {
    if (!editor.hasNodes([AutoLinkNode])) {
      throw new Error('LexicalAutoLinkPlugin: AutoLinkNode not registered on editor')
    }

    const onChangeWrapped = (url: null | string, prevUrl: null | string): void => {
      if (onChange != null) {
        onChange(url, prevUrl)
      }
    }

    return mergeRegister(
      editor.registerNodeTransform(TextNodeValue, (textNode: TextNode) => {
        const parent = textNode.getParentOrThrow()
        const previous = textNode.getPreviousSibling()
        if ($isAutoLinkNode(parent)) {
          handleLinkEdit(parent, matchers, onChangeWrapped)
        } else if (!$isLinkNode(parent)) {
          if (
            textNode.isSimpleText() &&
            (startsWithSeparator(textNode.getTextContent()) || !$isAutoLinkNode(previous))
          ) {
            const textNodesToMatch = getTextNodesToMatch(textNode)
            $handleLinkCreation(textNodesToMatch, matchers, onChangeWrapped)
          }

          handleBadNeighbors(textNode, matchers, onChangeWrapped)
        }
      }),
    )
  }, [editor, matchers, onChange])
}

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-\w@:%.+~#=]{1,256}\.[a-zA-Z\d()]{1,6}\b([-\w()@:%+.~#?&/=]*)(?<![-.+():%])/

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\])|(([a-z\-\d]+\.)+[a-z]{2,}))/i

const MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text.startsWith('http') ? text : `https://${text}`
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`
  }),
]

export const AutoLinkPlugin: PluginComponent<ClientProps> = () => {
  const [editor] = useLexicalComposerContext()

  useAutoLink(editor, MATCHERS)

  return null
}
