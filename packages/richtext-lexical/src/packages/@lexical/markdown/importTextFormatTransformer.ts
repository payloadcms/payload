/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TextNode } from 'lexical'

import type { TextFormatTransformersIndex } from './MarkdownImport.js'
import type { TextFormatTransformer } from './MarkdownTransformers.js'

import { PUNCTUATION_OR_SPACE } from './utils.js'

export function findOutermostTextFormatTransformer(
  textNode: TextNode,
  textFormatTransformersIndex: TextFormatTransformersIndex,
): {
  endIndex: number
  match: RegExpMatchArray
  startIndex: number
  transformer: TextFormatTransformer
} | null {
  const textContent = textNode.getTextContent()
  const match = findOutermostMatch(textContent, textFormatTransformersIndex)

  if (!match) {
    return null
  }

  const textFormatMatchStart: number = match.index || 0
  const textFormatMatchEnd = textFormatMatchStart + match[0].length

  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  const transformer: TextFormatTransformer = textFormatTransformersIndex.transformersByTag[match[1]]

  return {
    endIndex: textFormatMatchEnd,
    match,
    startIndex: textFormatMatchStart,
    transformer,
  }
}

// Finds first "<tag>content<tag>" match that is not nested into another tag
function findOutermostMatch(
  textContent: string,
  textTransformersIndex: TextFormatTransformersIndex,
): null | RegExpMatchArray {
  const openTagsMatch = textContent.match(textTransformersIndex.openTagsRegExp)

  if (openTagsMatch == null) {
    return null
  }

  for (const match of openTagsMatch) {
    // Open tags reg exp might capture leading space so removing it
    // before using match to find transformer
    const tag = match.replace(/^\s/, '')
    const fullMatchRegExp = textTransformersIndex.fullMatchRegExpByTag[tag]
    if (fullMatchRegExp == null) {
      continue
    }

    const fullMatch = textContent.match(fullMatchRegExp)
    const transformer = textTransformersIndex.transformersByTag[tag]
    if (fullMatch != null && transformer != null) {
      if (transformer.intraword !== false) {
        return fullMatch
      }

      // For non-intraword transformers checking if it's within a word
      // or surrounded with space/punctuation/newline
      const { index = 0 } = fullMatch
      const beforeChar = textContent[index - 1]
      const afterChar = textContent[index + fullMatch[0].length]

      if (
        (!beforeChar || PUNCTUATION_OR_SPACE.test(beforeChar)) &&
        (!afterChar || PUNCTUATION_OR_SPACE.test(afterChar))
      ) {
        return fullMatch
      }
    }
  }

  return null
}

export function importTextFormatTransformer(
  textNode: TextNode,
  startIndex: number,
  endIndex: number,
  transformer: TextFormatTransformer,
  match: RegExpMatchArray,
): {
  nodeAfter: TextNode | undefined // If split
  nodeBefore: TextNode | undefined // If split
  transformedNode: TextNode
} {
  const textContent = textNode.getTextContent()

  // No text matches - we can safely process the text format match
  let nodeAfter: TextNode | undefined
  let nodeBefore: TextNode | undefined
  let transformedNode: TextNode

  // If matching full content there's no need to run splitText and can reuse existing textNode
  // to update its content and apply format. E.g. for **_Hello_** string after applying bold
  // format (**) it will reuse the same text node to apply italic (_)
  if (match[0] === textContent) {
    transformedNode = textNode
  } else {
    if (startIndex === 0) {
      ;[transformedNode, nodeAfter] = textNode.splitText(endIndex) as [
        TextNode,
        TextNode | undefined,
      ]
    } else {
      ;[nodeBefore, transformedNode, nodeAfter] = textNode.splitText(startIndex, endIndex) as [
        TextNode,
        TextNode,
        TextNode | undefined,
      ]
    }
  }

  transformedNode.setTextContent(match[2]!)
  if (transformer) {
    for (const format of transformer.format) {
      if (!transformedNode.hasFormat(format)) {
        transformedNode.toggleFormat(format)
      }
    }
  }

  return {
    nodeAfter,
    nodeBefore,
    transformedNode,
  }
}
