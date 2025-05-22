/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ListItemNode } from '@lexical/list'
import type { ElementNode } from 'lexical'

import { $isListItemNode, $isListNode } from '@lexical/list'
import { $isQuoteNode } from '@lexical/rich-text'
import { $findMatchingParent } from '@lexical/utils'
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
} from 'lexical'

import type {
  ElementTransformer,
  MultilineElementTransformer,
  TextFormatTransformer,
  TextMatchTransformer,
  Transformer,
} from './MarkdownTransformers.js'

import { importTextTransformers } from './importTextTransformers.js'
import { isEmptyParagraph, transformersByType } from './utils.js'

export type TextFormatTransformersIndex = Readonly<{
  fullMatchRegExpByTag: Readonly<Record<string, RegExp>>
  openTagsRegExp: RegExp
  transformersByTag: Readonly<Record<string, TextFormatTransformer>>
}>

/**
 * Renders markdown from a string. The selection is moved to the start after the operation.
 */
export function createMarkdownImport(
  transformers: Array<Transformer>,
  shouldPreserveNewLines = false,
): (markdownString: string, node?: ElementNode) => void {
  const byType = transformersByType(transformers)
  const textFormatTransformersIndex = createTextFormatTransformersIndex(byType.textFormat)

  return (markdownString, node) => {
    const lines = markdownString.split('\n')
    const linesLength = lines.length
    const root = node || $getRoot()
    root.clear()

    for (let i = 0; i < linesLength; i++) {
      const lineText = lines[i]!

      const [imported, shiftedIndex] = $importMultiline(lines, i, byType.multilineElement, root)

      if (imported) {
        // If a multiline markdown element was imported, we don't want to process the lines that were part of it anymore.
        // There could be other sub-markdown elements (both multiline and normal ones) matching within this matched multiline element's children.
        // However, it would be the responsibility of the matched multiline transformer to decide how it wants to handle them.
        // We cannot handle those, as there is no way for us to know how to maintain the correct order of generated lexical nodes for possible children.
        i = shiftedIndex // Next loop will start from the line after the last line of the multiline element
        continue
      }

      $importBlocks(lineText, root, byType.element, textFormatTransformersIndex, byType.textMatch)
    }

    // By default, removing empty paragraphs as md does not really
    // allow empty lines and uses them as delimiter.
    // If you need empty lines set shouldPreserveNewLines = true.
    const children = root.getChildren()
    for (const child of children) {
      if (!shouldPreserveNewLines && isEmptyParagraph(child) && root.getChildrenSize() > 1) {
        child.remove()
      }
    }

    if ($getSelection() !== null) {
      root.selectStart()
    }
  }
}

/**
 *
 * @returns first element of the returned tuple is a boolean indicating if a multiline element was imported. The second element is the index of the last line that was processed.
 */
function $importMultiline(
  lines: Array<string>,
  startLineIndex: number,
  multilineElementTransformers: Array<MultilineElementTransformer>,
  rootNode: ElementNode,
): [boolean, number] {
  for (const transformer of multilineElementTransformers) {
    const { handleImportAfterStartMatch, regExpEnd, regExpStart, replace } = transformer

    const startMatch = lines[startLineIndex]?.match(regExpStart)
    if (!startMatch) {
      continue // Try next transformer
    }

    if (handleImportAfterStartMatch) {
      const result = handleImportAfterStartMatch({
        lines,
        rootNode,
        startLineIndex,
        startMatch,
        transformer,
      })
      if (result === null) {
        continue
      } else if (result) {
        return result
      }
    }

    const regexpEndRegex: RegExp | undefined =
      typeof regExpEnd === 'object' && 'regExp' in regExpEnd ? regExpEnd.regExp : regExpEnd

    const isEndOptional =
      regExpEnd && typeof regExpEnd === 'object' && 'optional' in regExpEnd
        ? regExpEnd.optional
        : !regExpEnd

    let endLineIndex = startLineIndex
    const linesLength = lines.length

    // check every single line for the closing match. It could also be on the same line as the opening match.
    while (endLineIndex < linesLength) {
      const endMatch = regexpEndRegex ? lines[endLineIndex]?.match(regexpEndRegex) : null
      if (!endMatch) {
        if (
          !isEndOptional ||
          (isEndOptional && endLineIndex < linesLength - 1) // Optional end, but didn't reach the end of the document yet => continue searching for potential closing match
        ) {
          endLineIndex++
          continue // Search next line for closing match
        }
      }

      // Now, check if the closing match matched is the same as the opening match.
      // If it is, we need to continue searching for the actual closing match.
      if (endMatch && startLineIndex === endLineIndex && endMatch.index === startMatch.index) {
        endLineIndex++
        continue // Search next line for closing match
      }

      // At this point, we have found the closing match. Next: calculate the lines in between open and closing match
      // This should not include the matches themselves, and be split up by lines
      const linesInBetween: string[] = []

      if (endMatch && startLineIndex === endLineIndex) {
        linesInBetween.push(lines[startLineIndex]!.slice(startMatch[0].length, -endMatch[0].length))
      } else {
        for (let i = startLineIndex; i <= endLineIndex; i++) {
          const line = lines[i]!
          if (i === startLineIndex) {
            const text = line.slice(startMatch[0].length)
            linesInBetween.push(text) // Also include empty text
          } else if (i === endLineIndex && endMatch) {
            const text = line.slice(0, -endMatch[0].length)
            linesInBetween.push(text) // Also include empty text
          } else {
            linesInBetween.push(line)
          }
        }
      }

      if (replace(rootNode, null, startMatch, endMatch!, linesInBetween, true) !== false) {
        // Return here. This $importMultiline function is run line by line and should only process a single multiline element at a time.
        return [true, endLineIndex]
      }

      // The replace function returned false, despite finding the matching open and close tags => this transformer does not want to handle it.
      // Thus, we continue letting the remaining transformers handle the passed lines of text from the beginning
      break
    }
  }

  // No multiline transformer handled this line successfully
  return [false, startLineIndex]
}

function $importBlocks(
  lineText: string,
  rootNode: ElementNode,
  elementTransformers: Array<ElementTransformer>,
  textFormatTransformersIndex: TextFormatTransformersIndex,
  textMatchTransformers: Array<TextMatchTransformer>,
) {
  const textNode = $createTextNode(lineText)
  const elementNode = $createParagraphNode()
  elementNode.append(textNode)
  rootNode.append(elementNode)

  for (const { regExp, replace } of elementTransformers) {
    const match = lineText.match(regExp)

    if (match) {
      textNode.setTextContent(lineText.slice(match[0].length))
      if (replace(elementNode, [textNode], match, true) !== false) {
        break
      }
    }
  }

  importTextTransformers(textNode, textFormatTransformersIndex, textMatchTransformers)

  // If no transformer found and we left with original paragraph node
  // can check if its content can be appended to the previous node
  // if it's a paragraph, quote or list
  if (elementNode.isAttached() && lineText.length > 0) {
    const previousNode = elementNode.getPreviousSibling()
    if ($isParagraphNode(previousNode) || $isQuoteNode(previousNode) || $isListNode(previousNode)) {
      let targetNode: ListItemNode | null | typeof previousNode = previousNode

      if ($isListNode(previousNode)) {
        const lastDescendant = previousNode.getLastDescendant()
        if (lastDescendant == null) {
          targetNode = null
        } else {
          targetNode = $findMatchingParent(lastDescendant, $isListItemNode)
        }
      }

      if (targetNode != null && targetNode.getTextContentSize() > 0) {
        targetNode.splice(targetNode.getChildrenSize(), 0, [
          $createLineBreakNode(),
          ...elementNode.getChildren(),
        ])
        elementNode.remove()
      }
    }
  }
}

function createTextFormatTransformersIndex(
  textTransformers: Array<TextFormatTransformer>,
): TextFormatTransformersIndex {
  const transformersByTag: Record<string, TextFormatTransformer> = {}
  const fullMatchRegExpByTag: Record<string, RegExp> = {}
  const openTagsRegExp: string[] = []
  const escapeRegExp = `(?<![\\\\])`

  for (const transformer of textTransformers) {
    const { tag } = transformer
    transformersByTag[tag] = transformer
    const tagRegExp = tag.replace(/([*^+])/g, '\\$1')
    openTagsRegExp.push(tagRegExp)

    // Single-char tag (e.g. "*"),
    if (tag.length === 1) {
      fullMatchRegExpByTag[tag] = new RegExp(
        `(?<![\\\\${tagRegExp}])(${tagRegExp})((\\\\${tagRegExp})?.*?[^${tagRegExp}\\s](\\\\${tagRegExp})?)((?<!\\\\)|(?<=\\\\\\\\))(${tagRegExp})(?![\\\\${tagRegExp}])`,
      )
    } else {
      // Multi‐char tags (e.g. "**")
      fullMatchRegExpByTag[tag] = new RegExp(
        `(?<!\\\\)(${tagRegExp})((\\\\${tagRegExp})?.*?[^\\s](\\\\${tagRegExp})?)((?<!\\\\)|(?<=\\\\\\\\))(${tagRegExp})(?!\\\\)`,
      )
    }
  }

  return {
    // Reg exp to find open tag + content + close tag
    fullMatchRegExpByTag,

    // Regexp to locate *any* potential opening tag (longest first).
    // eslint-disable-next-line regexp/no-useless-character-class, regexp/no-empty-capturing-group, regexp/no-empty-group
    openTagsRegExp: new RegExp(`${escapeRegExp}(${openTagsRegExp.join('|')})`, 'g'),
    transformersByTag,
  }
}
