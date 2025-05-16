import { type TextNode } from 'lexical'

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { TextMatchTransformer } from './MarkdownTransformers.js'

export function findOutermostTextMatchTransformer(
  textNode_: TextNode,
  textMatchTransformers: Array<TextMatchTransformer>,
): {
  endIndex: number
  match: RegExpMatchArray
  startIndex: number
  transformer: TextMatchTransformer
} | null {
  const textNode = textNode_

  let foundMatchStartIndex: number | undefined = undefined
  let foundMatchEndIndex: number | undefined = undefined
  let foundMatchTransformer: TextMatchTransformer | undefined = undefined
  let foundMatch: RegExpMatchArray | undefined = undefined

  for (const transformer of textMatchTransformers) {
    if (!transformer.replace || !transformer.importRegExp) {
      continue
    }
    const match = textNode.getTextContent().match(transformer.importRegExp)

    if (!match) {
      continue
    }

    const startIndex = match.index || 0
    const endIndex = transformer.getEndIndex
      ? transformer.getEndIndex(textNode, match)
      : startIndex + match[0].length

    if (endIndex === false) {
      continue
    }

    if (
      foundMatchStartIndex === undefined ||
      foundMatchEndIndex === undefined ||
      (startIndex < foundMatchStartIndex && endIndex > foundMatchEndIndex)
    ) {
      foundMatchStartIndex = startIndex
      foundMatchEndIndex = endIndex
      foundMatchTransformer = transformer
      foundMatch = match
    }
  }

  if (
    foundMatchStartIndex === undefined ||
    foundMatchEndIndex === undefined ||
    foundMatchTransformer === undefined ||
    foundMatch === undefined
  ) {
    return null
  }

  return {
    endIndex: foundMatchEndIndex,
    match: foundMatch,
    startIndex: foundMatchStartIndex,
    transformer: foundMatchTransformer,
  }
}

export function importFoundTextMatchTransformer(
  textNode: TextNode,
  startIndex: number,
  endIndex: number,
  transformer: TextMatchTransformer,
  match: RegExpMatchArray,
): {
  nodeAfter: TextNode | undefined // If split
  nodeBefore: TextNode | undefined // If split
  transformedNode?: TextNode
} | null {
  let nodeAfter, nodeBefore, transformedNode

  if (startIndex === 0) {
    ;[transformedNode, nodeAfter] = textNode.splitText(endIndex)
  } else {
    ;[nodeBefore, transformedNode, nodeAfter] = textNode.splitText(startIndex, endIndex)
  }

  if (!transformer.replace) {
    return null
  }
  const potentialTransformedNode = transformedNode
    ? transformer.replace(transformedNode, match)
    : undefined

  return {
    nodeAfter,
    nodeBefore,
    transformedNode: potentialTransformedNode || undefined,
  }
}
