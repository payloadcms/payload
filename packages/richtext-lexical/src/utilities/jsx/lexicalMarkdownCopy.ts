/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ListItemNode } from '@lexical/list'
import type {
  MultilineElementTransformer as _MultilineElementTransformer,
  ElementTransformer,
  TextFormatTransformer,
  TextMatchTransformer,
  Transformer,
} from '@lexical/markdown'
import type { ElementNode, LexicalNode, TextNode } from 'lexical'

export type MultilineElementTransformer = {
  handleImportAfterStartMatch?: (args: {
    lines: Array<string>
    rootNode: ElementNode
    startLineIndex: number
    startMatch: RegExpMatchArray
    transformer: MultilineElementTransformer
  }) => {
    continue?: boolean
    return?: [boolean, number]
  }
  /**
   * `replace` is called only when markdown is imported in the editor, not when it's typed
   *
   * @return return false to cancel the transform, even though the regex matched. Lexical will then search for the next transformer.
   */
  replace: (
    rootNode: ElementNode,
    /**
     * During markdown shortcut transforms, children nodes may be provided to the transformer. If this is the case, no `linesInBetween` will be provided and
     * the children nodes should be used instead of the `linesInBetween` to create the new node.
     */
    children: Array<LexicalNode> | null,
    startMatch: RegExpMatchArray,
    endMatch: null | RegExpMatchArray,
    /**
     * linesInBetween includes the text between the start & end matches, split up by lines, not including the matches themselves.
     * This is null when the transformer is triggered through markdown shortcuts (by typing in the editor)
     */
    linesInBetween: Array<string> | null,
    /**
     * Whether the match is from an import operation (e.g. through `$convertFromMarkdownString`) or not (e.g. through typing in the editor).
     */
    isImport: boolean,
  ) => boolean | void
} & Omit<_MultilineElementTransformer, 'replace'>

import { $isListItemNode, $isListNode } from '@lexical/list'
import { TRANSFORMERS } from '@lexical/markdown'
import { $isQuoteNode } from '@lexical/rich-text'
import { $findMatchingParent, IS_APPLE_WEBKIT, IS_IOS, IS_SAFARI } from '@lexical/utils'
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isTextNode,
} from 'lexical'

type TextFormatTransformersIndex = Readonly<{
  fullMatchRegExpByTag: Readonly<Record<string, RegExp>>
  openTagsRegExp: RegExp
  transformersByTag: Readonly<Record<string, TextFormatTransformer>>
}>

export function indexBy<T>(
  list: Array<T>,
  callback: (arg0: T) => string | undefined,
): Readonly<Record<string, Array<T>>> {
  const index: Record<string, Array<T>> = {}

  for (const item of list) {
    const key = callback(item)

    if (!key) {
      continue
    }

    if (index[key]) {
      index[key].push(item)
    } else {
      index[key] = [item]
    }
  }

  return index
}

export function transformersByType(transformers: Array<Transformer>): Readonly<{
  element: Array<ElementTransformer>
  multilineElement: Array<MultilineElementTransformer>
  textFormat: Array<TextFormatTransformer>
  textMatch: Array<TextMatchTransformer>
}> {
  const byType = indexBy(transformers, (t) => t.type)

  return {
    element: (byType.element || []) as Array<ElementTransformer>,
    multilineElement: (byType['multiline-element'] || []) as Array<MultilineElementTransformer>,
    textFormat: (byType['text-format'] || []) as Array<TextFormatTransformer>,
    textMatch: (byType['text-match'] || []) as Array<TextMatchTransformer>,
  }
}
const MARKDOWN_EMPTY_LINE_REG_EXP = /^\s{0,3}$/

export function isEmptyParagraph(node: LexicalNode): boolean {
  if (!$isParagraphNode(node)) {
    return false
  }

  const firstChild = node.getFirstChild()
  return (
    firstChild == null ||
    (node.getChildrenSize() === 1 &&
      $isTextNode(firstChild) &&
      MARKDOWN_EMPTY_LINE_REG_EXP.test(firstChild.getTextContent()))
  )
}

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
      const lineText = lines[i]

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
    const startMatch = lines[startLineIndex].match(regExpStart)
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
      if (result.continue) {
        continue
      } else if (result.return) {
        return result.return
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

    let openedSubStartMatches = 0

    // check every single line for the closing match. It could also be on the same line as the opening match.
    while (endLineIndex < linesLength) {
      const potentialSubStartMatch = lines[endLineIndex].match(regExpStart)

      const endMatch = regexpEndRegex ? lines[endLineIndex].match(regexpEndRegex) : null

      if (potentialSubStartMatch) {
        if (endMatch) {
          if ((potentialSubStartMatch.index ?? 0) < (endMatch.index ?? 0)) {
            openedSubStartMatches++
          }
        } else {
          openedSubStartMatches++
        }
      }

      if (endMatch) {
        openedSubStartMatches--
      }

      if (!endMatch || openedSubStartMatches > 0) {
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
        linesInBetween.push(lines[startLineIndex].slice(startMatch[0].length, -endMatch[0].length))
      } else {
        for (let i = startLineIndex; i <= endLineIndex; i++) {
          if (i === startLineIndex) {
            const text = lines[i].slice(startMatch[0].length)
            linesInBetween.push(text) // Also include empty text
          } else if (i === endLineIndex && endMatch) {
            const text = lines[i].slice(0, -endMatch[0].length)
            linesInBetween.push(text) // Also include empty text
          } else {
            linesInBetween.push(lines[i])
          }
        }
      }

      if (replace(rootNode, null, startMatch, endMatch, linesInBetween, true) !== false) {
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

  importTextFormatTransformers(textNode, textFormatTransformersIndex, textMatchTransformers)

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

// Processing text content and replaces text format tags.
// It takes outermost tag match and its content, creates text node with
// format based on tag and then recursively executed over node's content
//
// E.g. for "*Hello **world**!*" string it will create text node with
// "Hello **world**!" content and italic format and run recursively over
// its content to transform "**world**" part
function importTextFormatTransformers(
  textNode: TextNode,
  textFormatTransformersIndex: TextFormatTransformersIndex,
  textMatchTransformers: Array<TextMatchTransformer>,
) {
  const textContent = textNode.getTextContent()
  const match = findOutermostMatch(textContent, textFormatTransformersIndex)

  if (!match) {
    // Once text format processing is done run text match transformers, as it
    // only can span within single text node (unline formats that can cover multiple nodes)
    importTextMatchTransformers(textNode, textMatchTransformers)
    return
  }

  let currentNode, leadingNode, remainderNode

  // If matching full content there's no need to run splitText and can reuse existing textNode
  // to update its content and apply format. E.g. for **_Hello_** string after applying bold
  // format (**) it will reuse the same text node to apply italic (_)
  if (match[0] === textContent) {
    currentNode = textNode
  } else {
    const startIndex = match.index || 0
    const endIndex = startIndex + match[0].length

    if (startIndex === 0) {
      ;[currentNode, remainderNode] = textNode.splitText(endIndex)
    } else {
      ;[leadingNode, currentNode, remainderNode] = textNode.splitText(startIndex, endIndex)
    }
  }

  currentNode.setTextContent(match[2])
  const transformer = textFormatTransformersIndex.transformersByTag[match[1]]

  if (transformer) {
    for (const format of transformer.format) {
      if (!currentNode.hasFormat(format)) {
        currentNode.toggleFormat(format)
      }
    }
  }

  // Recursively run over inner text if it's not inline code
  if (!currentNode.hasFormat('code')) {
    importTextFormatTransformers(currentNode, textFormatTransformersIndex, textMatchTransformers)
  }

  // Run over leading/remaining text if any
  if (leadingNode) {
    importTextFormatTransformers(leadingNode, textFormatTransformersIndex, textMatchTransformers)
  }

  if (remainderNode) {
    importTextFormatTransformers(remainderNode, textFormatTransformersIndex, textMatchTransformers)
  }
}

function importTextMatchTransformers(
  textNode_: TextNode,
  textMatchTransformers: Array<TextMatchTransformer>,
) {
  let textNode = textNode_

  mainLoop: while (textNode) {
    for (const transformer of textMatchTransformers) {
      if (!transformer.replace || !transformer.importRegExp) {
        continue
      }

      const match = textNode.getTextContent().match(transformer.importRegExp)

      if (!match) {
        continue
      }

      const startIndex = match.index || 0
      // @ts-expect-error TODO: PR to lexical
      const endIndex = transformer?.getEndIndex
        ? // @ts-expect-error TODO: PR to lexical
          transformer?.getEndIndex(textNode, match)
        : startIndex + match[0].length
      let newTextNode, replaceNode

      if (startIndex === 0) {
        ;[replaceNode, textNode] = textNode.splitText(endIndex)
      } else {
        ;[, replaceNode, newTextNode] = textNode.splitText(startIndex, endIndex)
      }

      if (newTextNode) {
        importTextMatchTransformers(newTextNode, textMatchTransformers)
      }
      transformer.replace(replaceNode, match)
      continue mainLoop
    }

    break
  }
}
// eslint-disable-next-line regexp/no-obscure-range
export const PUNCTUATION_OR_SPACE = /[!-/:-@[-`{-~\s]/

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

    if (IS_SAFARI || IS_IOS || IS_APPLE_WEBKIT) {
      fullMatchRegExpByTag[tag] = new RegExp(
        `(${tagRegExp})(?![${tagRegExp}\\s])(.*?[^${tagRegExp}\\s])${tagRegExp}(?!${tagRegExp})`,
      )
    } else {
      fullMatchRegExpByTag[tag] = new RegExp(
        `(?<![\\\\${tagRegExp}])(${tagRegExp})((\\\\${tagRegExp})?.*?[^${tagRegExp}\\s](\\\\${tagRegExp})?)((?<!\\\\)|(?<=\\\\\\\\))(${tagRegExp})(?![\\\\${tagRegExp}])`,
      )
    }
  }

  return {
    // Reg exp to find open tag + content + close tag
    fullMatchRegExpByTag,
    // Reg exp to find opening tags
    openTagsRegExp: new RegExp(
      (IS_SAFARI || IS_IOS || IS_APPLE_WEBKIT ? '' : `${escapeRegExp}`) +
        '(' +
        openTagsRegExp.join('|') +
        ')',
      'g',
    ),
    transformersByTag,
  }
}

export function $customConvertFromMarkdownString(
  markdown: string,
  transformers: Array<Transformer> = TRANSFORMERS,
  node?: ElementNode,
  shouldPreserveNewLines = false,
): void {
  const importMarkdown = createMarkdownImport(transformers, shouldPreserveNewLines)
  return importMarkdown(markdown, node)
}
