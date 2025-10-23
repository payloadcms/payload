/* eslint-disable regexp/no-unused-capturing-group */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ListType } from '@lexical/list'
import type { HeadingTagType } from '@lexical/rich-text'
import type { ElementNode, Klass, LexicalNode, TextFormatType, TextNode } from 'lexical'

import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from '@lexical/list'
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
} from '@lexical/rich-text'
import { $createLineBreakNode } from 'lexical'

export type Transformer =
  | ElementTransformer
  | MultilineElementTransformer
  | TextFormatTransformer
  | TextMatchTransformer

export type ElementTransformer = {
  dependencies: Array<Klass<LexicalNode>>
  /**
   * `export` is called when the `$convertToMarkdownString` is called to convert the editor state into markdown.
   *
   * @return return null to cancel the export, even though the regex matched. Lexical will then search for the next transformer.
   */
  export: (
    node: LexicalNode,

    traverseChildren: (node: ElementNode) => string,
  ) => null | string
  regExp: RegExp
  /**
   * `replace` is called when markdown is imported or typed in the editor
   *
   * @return return false to cancel the transform, even though the regex matched. Lexical will then search for the next transformer.
   */
  replace: (
    parentNode: ElementNode,
    children: Array<LexicalNode>,
    match: Array<string>,
    /**
     * Whether the match is from an import operation (e.g. through `$convertFromMarkdownString`) or not (e.g. through typing in the editor).
     */
    isImport: boolean,
  ) => boolean | void
  type: 'element'
}

export type MultilineElementTransformer = {
  dependencies: Array<Klass<LexicalNode>>
  /**
   * `export` is called when the `$convertToMarkdownString` is called to convert the editor state into markdown.
   *
   * @return return null to cancel the export, even though the regex matched. Lexical will then search for the next transformer.
   */
  export?: (
    node: LexicalNode,

    traverseChildren: (node: ElementNode) => string,
  ) => null | string
  /**
   * Use this function to manually handle the import process, once the `regExpStart` has matched successfully.
   * Without providing this function, the default behavior is to match until `regExpEnd` is found, or until the end of the document if `regExpEnd.optional` is true.
   *
   * @returns a tuple or null. The first element of the returned tuple is a boolean indicating if a multiline element was imported. The second element is the index of the last line that was processed. If null is returned, the next multilineElementTransformer will be tried. If undefined is returned, the default behavior will be used.
   */
  handleImportAfterStartMatch?: (args: {
    lines: Array<string>
    rootNode: ElementNode
    startLineIndex: number
    startMatch: RegExpMatchArray
    transformer: MultilineElementTransformer
  }) => [boolean, number] | null | undefined
  /**
   * This regex determines when to stop matching. Anything in between regExpStart and regExpEnd will be matched
   */
  regExpEnd?:
    | {
        /**
         * Whether the end match is optional. If true, the end match is not required to match for the transformer to be triggered.
         * The entire text from regexpStart to the end of the document will then be matched.
         */
        optional?: true
        regExp: RegExp
      }
    | RegExp
  /**
   * This regex determines when to start matching
   */
  regExpStart: RegExp
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
    startMatch: Array<string>,
    endMatch: Array<string> | null,
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
  type: 'multiline-element'
}

export type TextFormatTransformer = Readonly<{
  format: ReadonlyArray<TextFormatType>
  intraword?: boolean
  tag: string
  type: 'text-format'
}>

export type TextMatchTransformer = Readonly<{
  dependencies: Array<Klass<LexicalNode>>
  /**
   * Determines how a node should be exported to markdown
   */
  export?: (
    node: LexicalNode,

    exportChildren: (node: ElementNode) => string,

    exportFormat: (node: TextNode, textContent: string) => string,
  ) => null | string
  /**
   * For import operations, this function can be used to determine the end index of the match, after `importRegExp` has matched.
   * Without this function, the end index will be determined by the length of the match from `importRegExp`. Manually determining the end index can be useful if
   * the match from `importRegExp` is not the entire text content of the node. That way, `importRegExp` can be used to match only the start of the node, and `getEndIndex`
   * can be used to match the end of the node.
   *
   * @returns The end index of the match, or false if the match was unsuccessful and a different transformer should be tried.
   */
  getEndIndex?: (node: TextNode, match: RegExpMatchArray) => false | number
  /**
   * This regex determines what text is matched during markdown imports
   */
  importRegExp?: RegExp
  /**
   * This regex determines what text is matched for markdown shortcuts while typing in the editor
   */
  regExp: RegExp
  /**
   * Determines how the matched markdown text should be transformed into a node during the markdown import process
   *
   * @returns nothing, or a TextNode that may be a child of the new node that is created.
   * If a TextNode is returned, text format matching will be applied to it (e.g. bold, italic, etc.)
   */
  replace?: (node: TextNode, match: RegExpMatchArray) => TextNode | void
  /**
   * Single character that allows the transformer to trigger when typed in the editor. This does not affect markdown imports outside of the markdown shortcut plugin.
   * If the trigger is matched, the `regExp` will be used to match the text in the second step.
   */
  trigger?: string
  type: 'text-match'
}>

const EMPTY_OR_WHITESPACE_ONLY = /^[\t ]*$/
const ORDERED_LIST_REGEX = /^(\s*)(\d+)\.\s/
const UNORDERED_LIST_REGEX = /^(\s*)[-*+]\s/
const CHECK_LIST_REGEX = /^(\s*)(?:-\s)?\s?(\[(\s|x)?\])\s/i
const HEADING_REGEX = /^(#{1,6})\s/
const QUOTE_REGEX = /^>\s/
const CODE_START_REGEX = /^[ \t]*(\\`\\`\\`|```)(\w+)?/
const CODE_END_REGEX = /[ \t]*(\\`\\`\\`|```)$/
const CODE_SINGLE_LINE_REGEX = /^[ \t]*```[^`]+(?:(?:`{1,2}|`{4,})[^`]+)*```(?:[^`]|$)/
const TABLE_ROW_REG_EXP = /^\|(.+)\|\s?$/
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/
const TAG_START_REGEX = /^[ \t]*<[a-z_][\w-]*(?:\s[^<>]*)?\/?>/i
const TAG_END_REGEX = /^[ \t]*<\/[a-z_][\w-]*\s*>/i

const createBlockNode = (
  createNode: (match: Array<string>) => ElementNode,
): ElementTransformer['replace'] => {
  return (parentNode, children, match) => {
    const node = createNode(match)
    node.append(...children)
    parentNode.replace(node)
    node.select(0, 0)
  }
}

// Amount of spaces that define indentation level
// TODO: should be an option
const LIST_INDENT_SIZE = 4

function getIndent(whitespaces: string): number {
  const tabs = whitespaces.match(/\t/g)
  const spaces = whitespaces.match(/ /g)

  let indent = 0

  if (tabs) {
    indent += tabs.length
  }

  if (spaces) {
    indent += Math.floor(spaces.length / LIST_INDENT_SIZE)
  }

  return indent
}

const listReplace = (listType: ListType): ElementTransformer['replace'] => {
  return (parentNode, children, match) => {
    const previousNode = parentNode.getPreviousSibling()
    const nextNode = parentNode.getNextSibling()
    const listItem = $createListItemNode(listType === 'check' ? match[3] === 'x' : undefined)
    if ($isListNode(nextNode) && nextNode.getListType() === listType) {
      const firstChild = nextNode.getFirstChild()
      if (firstChild !== null) {
        firstChild.insertBefore(listItem)
      } else {
        // should never happen, but let's handle gracefully, just in case.
        nextNode.append(listItem)
      }
      parentNode.remove()
    } else if ($isListNode(previousNode) && previousNode.getListType() === listType) {
      previousNode.append(listItem)
      parentNode.remove()
    } else {
      const list = $createListNode(listType, listType === 'number' ? Number(match[2]) : undefined)
      list.append(listItem)
      parentNode.replace(list)
    }
    listItem.append(...children)
    listItem.select(0, 0)
    const indent = getIndent(match[1]!)
    if (indent) {
      listItem.setIndent(indent)
    }
  }
}

const listExport = (
  listNode: ListNode,
  exportChildren: (node: ElementNode) => string,
  depth: number,
): string => {
  const output: string[] = []
  const children = listNode.getChildren()
  let index = 0
  for (const listItemNode of children) {
    if ($isListItemNode(listItemNode)) {
      if (listItemNode.getChildrenSize() === 1) {
        const firstChild = listItemNode.getFirstChild()
        if ($isListNode(firstChild)) {
          output.push(listExport(firstChild, exportChildren, depth + 1))
          continue
        }
      }
      const indent = ' '.repeat(depth * LIST_INDENT_SIZE)
      const listType = listNode.getListType()
      const prefix =
        listType === 'number'
          ? `${listNode.getStart() + index}. `
          : listType === 'check'
            ? `- [${listItemNode.getChecked() ? 'x' : ' '}] `
            : '- '
      output.push(indent + prefix + exportChildren(listItemNode))
      index++
    }
  }

  return output.join('\n')
}

export const HEADING: ElementTransformer = {
  type: 'element',
  dependencies: [HeadingNode],
  export: (node, exportChildren) => {
    if (!$isHeadingNode(node)) {
      return null
    }
    const level = Number(node.getTag().slice(1))
    return '#'.repeat(level) + ' ' + exportChildren(node)
  },
  regExp: HEADING_REGEX,
  replace: createBlockNode((match) => {
    const tag = ('h' + match[1]!.length) as HeadingTagType
    return $createHeadingNode(tag)
  }),
}

export const QUOTE: ElementTransformer = {
  type: 'element',
  dependencies: [QuoteNode],
  export: (node, exportChildren) => {
    if (!$isQuoteNode(node)) {
      return null
    }

    const lines = exportChildren(node).split('\n')
    const output: string[] = []
    for (const line of lines) {
      output.push('> ' + line)
    }
    return output.join('\n')
  },
  regExp: QUOTE_REGEX,
  replace: (parentNode, children, _match, isImport) => {
    if (isImport) {
      const previousNode = parentNode.getPreviousSibling()
      if ($isQuoteNode(previousNode)) {
        previousNode.splice(previousNode.getChildrenSize(), 0, [
          $createLineBreakNode(),
          ...children,
        ])
        previousNode.select(0, 0)
        parentNode.remove()
        return
      }
    }

    const node = $createQuoteNode()
    node.append(...children)
    parentNode.replace(node)
    node.select(0, 0)
  },
}

export const UNORDERED_LIST: ElementTransformer = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null
  },
  regExp: UNORDERED_LIST_REGEX,
  replace: listReplace('bullet'),
}

export const CHECK_LIST: ElementTransformer = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null
  },
  regExp: CHECK_LIST_REGEX,
  replace: listReplace('check'),
}

export const ORDERED_LIST: ElementTransformer = {
  type: 'element',
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren) => {
    return $isListNode(node) ? listExport(node, exportChildren, 0) : null
  },
  regExp: ORDERED_LIST_REGEX,
  replace: listReplace('number'),
}

export const INLINE_CODE: TextFormatTransformer = {
  type: 'text-format',
  format: ['code'],
  tag: '`',
}

export const HIGHLIGHT: TextFormatTransformer = {
  type: 'text-format',
  format: ['highlight'],
  tag: '==',
}

export const BOLD_ITALIC_STAR: TextFormatTransformer = {
  type: 'text-format',
  format: ['bold', 'italic'],
  tag: '***',
}

export const BOLD_ITALIC_UNDERSCORE: TextFormatTransformer = {
  type: 'text-format',
  format: ['bold', 'italic'],
  intraword: false,
  tag: '___',
}

export const BOLD_STAR: TextFormatTransformer = {
  type: 'text-format',
  format: ['bold'],
  tag: '**',
}

export const BOLD_UNDERSCORE: TextFormatTransformer = {
  type: 'text-format',
  format: ['bold'],
  intraword: false,
  tag: '__',
}

export const STRIKETHROUGH: TextFormatTransformer = {
  type: 'text-format',
  format: ['strikethrough'],
  tag: '~~',
}

export const ITALIC_STAR: TextFormatTransformer = {
  type: 'text-format',
  format: ['italic'],
  tag: '*',
}

export const ITALIC_UNDERSCORE: TextFormatTransformer = {
  type: 'text-format',
  format: ['italic'],
  intraword: false,
  tag: '_',
}

export function normalizeMarkdown(input: string, shouldMergeAdjacentLines: boolean): string {
  const lines = input.split('\n')
  let inCodeBlock = false
  const sanitizedLines: string[] = []
  let nestedDeepCodeBlock = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const lastLine = sanitizedLines[sanitizedLines.length - 1]

    // Code blocks of ```single line``` don't toggle the inCodeBlock flag
    if (CODE_SINGLE_LINE_REGEX.test(line)) {
      sanitizedLines.push(line)
      continue
    }

    if (CODE_END_REGEX.test(line)) {
      if (nestedDeepCodeBlock === 0) {
        inCodeBlock = true
      }
      if (nestedDeepCodeBlock === 1) {
        inCodeBlock = false
      }
      if (nestedDeepCodeBlock > 0) {
        nestedDeepCodeBlock--
      }
      sanitizedLines.push(line)
      continue
    }

    // Toggle inCodeBlock state when encountering start or end of a code block
    if (CODE_START_REGEX.test(line)) {
      inCodeBlock = true
      nestedDeepCodeBlock++
      sanitizedLines.push(line)
      continue
    }

    // If we are inside a code block, keep the line unchanged
    if (inCodeBlock) {
      sanitizedLines.push(line)
      continue
    }

    // In markdown the concept of "empty paragraphs" does not exist.
    // Blocks must be separated by an empty line. Non-empty adjacent lines must be merged.
    if (
      EMPTY_OR_WHITESPACE_ONLY.test(line) ||
      EMPTY_OR_WHITESPACE_ONLY.test(lastLine!) ||
      !lastLine ||
      HEADING_REGEX.test(lastLine) ||
      HEADING_REGEX.test(line) ||
      QUOTE_REGEX.test(line) ||
      ORDERED_LIST_REGEX.test(line) ||
      UNORDERED_LIST_REGEX.test(line) ||
      CHECK_LIST_REGEX.test(line) ||
      TABLE_ROW_REG_EXP.test(line) ||
      TABLE_ROW_DIVIDER_REG_EXP.test(line) ||
      !shouldMergeAdjacentLines ||
      TAG_START_REGEX.test(line) ||
      TAG_END_REGEX.test(line) ||
      TAG_START_REGEX.test(lastLine) ||
      TAG_END_REGEX.test(lastLine) ||
      CODE_END_REGEX.test(lastLine)
    ) {
      sanitizedLines.push(line)
    } else {
      sanitizedLines[sanitizedLines.length - 1] = lastLine + ' ' + line.trim()
    }
  }

  return sanitizedLines.join('\n')
}
