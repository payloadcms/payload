import { $isTextNode, type LexicalNode, type TextNode } from 'lexical'

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { TextFormatTransformersIndex } from './MarkdownImport'
import type { TextMatchTransformer } from './MarkdownTransformers'

import {
  findOutermostTextFormatTransformer,
  importTextFormatTransformer,
} from './importTextFormatTransformer'
import {
  findOutermostTextMatchTransformer,
  importFoundTextMatchTransformer,
} from './importTextMatchTransformer'

/**
 * Returns true if the node can contain transformable markdown.
 * Code nodes cannot contain transformable markdown.
 * For example, `code **bold**` should not be transformed to
 * <code>code <strong>bold</strong></code>.
 */
export function canContainTransformableMarkdown(node: LexicalNode | undefined): node is TextNode {
  return $isTextNode(node) && !node.hasFormat('code')
}

/**
 * Handles applying both text format and text match transformers.
 * It finds the outermost text format or text match and applies it,
 * then recursively calls itself to apply the next outermost transformer,
 * until there are no more transformers to apply.
 */
export function importTextTransformers(
  textNode: TextNode,
  textFormatTransformersIndex: TextFormatTransformersIndex,
  textMatchTransformers: Array<TextMatchTransformer>,
) {
  let foundTextFormat = findOutermostTextFormatTransformer(textNode, textFormatTransformersIndex)

  let foundTextMatch = findOutermostTextMatchTransformer(textNode, textMatchTransformers)

  if (foundTextFormat && foundTextMatch) {
    // Find the outermost transformer
    if (
      (foundTextFormat.startIndex <= foundTextMatch.startIndex &&
        foundTextFormat.endIndex >= foundTextMatch.endIndex) ||
      // foundTextMatch is not contained within foundTextFormat
      foundTextMatch.startIndex > foundTextFormat.endIndex
    ) {
      // foundTextFormat wraps foundTextMatch - apply foundTextFormat by setting foundTextMatch to null
      foundTextMatch = null
    } else {
      // foundTextMatch wraps foundTextFormat - apply foundTextMatch by setting foundTextFormat to null
      foundTextFormat = null
    }
  }

  if (foundTextFormat) {
    const result = importTextFormatTransformer(
      textNode,
      foundTextFormat.startIndex,
      foundTextFormat.endIndex,
      foundTextFormat.transformer,
      foundTextFormat.match,
    )

    if (canContainTransformableMarkdown(result.nodeAfter)) {
      importTextTransformers(result.nodeAfter, textFormatTransformersIndex, textMatchTransformers)
    }
    if (canContainTransformableMarkdown(result.nodeBefore)) {
      importTextTransformers(result.nodeBefore, textFormatTransformersIndex, textMatchTransformers)
    }
    if (canContainTransformableMarkdown(result.transformedNode)) {
      importTextTransformers(
        result.transformedNode,
        textFormatTransformersIndex,
        textMatchTransformers,
      )
    }
  } else if (foundTextMatch) {
    const result = importFoundTextMatchTransformer(
      textNode,
      foundTextMatch.startIndex,
      foundTextMatch.endIndex,
      foundTextMatch.transformer,
      foundTextMatch.match,
    )
    if (!result) {
      return
    }

    if (canContainTransformableMarkdown(result.nodeAfter)) {
      importTextTransformers(result.nodeAfter, textFormatTransformersIndex, textMatchTransformers)
    }
    if (canContainTransformableMarkdown(result.nodeBefore)) {
      importTextTransformers(result.nodeBefore, textFormatTransformersIndex, textMatchTransformers)
    }
    if (canContainTransformableMarkdown(result.transformedNode)) {
      importTextTransformers(
        result.transformedNode,
        textFormatTransformersIndex,
        textMatchTransformers,
      )
    }
  }

  // Handle escape characters
  const textContent = textNode.getTextContent()
  const escapedText = textContent
    .replace(/\\([*_`~\\])/g, '$1')
    .replace(/&#(\d+);/g, (_, codePoint) => {
      return String.fromCodePoint(codePoint)
    })
  textNode.setTextContent(escapedText)
}
