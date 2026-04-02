/* eslint-disable regexp/no-obscure-range */
/* eslint-disable regexp/no-empty-group */
/* eslint-disable regexp/no-empty-capturing-group */
/* eslint-disable regexp/optimal-quantifier-concatenation */
/* eslint-disable regexp/no-misleading-capturing-group */
/* eslint-disable regexp/no-contradiction-with-assertion */
/* eslint-disable regexp/no-super-linear-backtracking */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ListNode } from '@lexical/list'

import { $isListItemNode, $isListNode } from '@lexical/list'
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text'
import {
  $isParagraphNode,
  $isTextNode,
  type ElementNode,
  type LexicalNode,
  type TextFormatType,
} from 'lexical'

import type {
  ElementTransformer,
  MultilineElementTransformer,
  TextFormatTransformer,
  TextMatchTransformer,
  Transformer,
} from './MarkdownTransformers.js'

type MarkdownFormatKind =
  | 'bold'
  | 'code'
  | 'horizontalRule'
  | 'italic'
  | 'italic_bold'
  | 'link'
  | 'noTransformation'
  | 'paragraphBlockQuote'
  | 'paragraphCodeBlock'
  | 'paragraphH1'
  | 'paragraphH2'
  | 'paragraphH3'
  | 'paragraphH4'
  | 'paragraphH5'
  | 'paragraphH6'
  | 'paragraphOrderedList'
  | 'paragraphUnorderedList'
  | 'strikethrough'
  | 'strikethrough_bold'
  | 'strikethrough_italic'
  | 'strikethrough_italic_bold'
  | 'underline'

type MarkdownCriteria = Readonly<{
  export?: (
    node: LexicalNode,
    traverseChildren: (elementNode: ElementNode) => string,
  ) => null | string
  exportFormat?: TextFormatType
  exportTag?: string
  exportTagClose?: string
  markdownFormatKind: MarkdownFormatKind | null | undefined
  regEx: RegExp
  regExForAutoFormatting: RegExp
  requiresParagraphStart: boolean | null | undefined
}>

type MarkdownCriteriaArray = Array<MarkdownCriteria>

const autoFormatBase: MarkdownCriteria = {
  markdownFormatKind: null,
  regEx: /(?:)/,
  regExForAutoFormatting: /(?:)/,
  requiresParagraphStart: false,
}

const paragraphStartBase: MarkdownCriteria = {
  ...autoFormatBase,
  requiresParagraphStart: true,
}

const markdownHeader1: MarkdownCriteria = {
  ...paragraphStartBase,
  export: createHeadingExport(1),
  markdownFormatKind: 'paragraphH1',
  regEx: /^# /,
  regExForAutoFormatting: /^# /,
}

const markdownHeader2: MarkdownCriteria = {
  ...paragraphStartBase,
  export: createHeadingExport(2),
  markdownFormatKind: 'paragraphH2',
  regEx: /^## /,
  regExForAutoFormatting: /^## /,
}

const markdownHeader3: MarkdownCriteria = {
  ...paragraphStartBase,
  export: createHeadingExport(3),
  markdownFormatKind: 'paragraphH3',
  regEx: /^### /,
  regExForAutoFormatting: /^### /,
}

const markdownHeader4: MarkdownCriteria = {
  ...paragraphStartBase,
  export: createHeadingExport(4),
  markdownFormatKind: 'paragraphH4',
  regEx: /^#### /,
  regExForAutoFormatting: /^#### /,
}

const markdownHeader5: MarkdownCriteria = {
  ...paragraphStartBase,
  export: createHeadingExport(5),
  markdownFormatKind: 'paragraphH5',
  regEx: /^##### /,
  regExForAutoFormatting: /^##### /,
}

const markdownHeader6: MarkdownCriteria = {
  ...paragraphStartBase,
  export: createHeadingExport(6),
  markdownFormatKind: 'paragraphH6',
  regEx: /^###### /,
  regExForAutoFormatting: /^###### /,
}

const markdownBlockQuote: MarkdownCriteria = {
  ...paragraphStartBase,
  export: blockQuoteExport,
  markdownFormatKind: 'paragraphBlockQuote',
  regEx: /^> /,
  regExForAutoFormatting: /^> /,
}

const markdownUnorderedListDash: MarkdownCriteria = {
  ...paragraphStartBase,
  export: listExport,
  markdownFormatKind: 'paragraphUnorderedList',
  regEx: /^(\s{0,10})- /,
  regExForAutoFormatting: /^(\s{0,10})- /,
}

const markdownUnorderedListAsterisk: MarkdownCriteria = {
  ...paragraphStartBase,
  export: listExport,
  markdownFormatKind: 'paragraphUnorderedList',
  regEx: /^(\s{0,10})\* /,
  regExForAutoFormatting: /^(\s{0,10})\* /,
}

const markdownOrderedList: MarkdownCriteria = {
  ...paragraphStartBase,
  export: listExport,
  markdownFormatKind: 'paragraphOrderedList',
  regEx: /^(\s{0,10})(\d+)\.\s/,
  regExForAutoFormatting: /^(\s{0,10})(\d+)\.\s/,
}

const markdownHorizontalRule: MarkdownCriteria = {
  ...paragraphStartBase,
  markdownFormatKind: 'horizontalRule',
  regEx: /^\*\*\*$/,
  regExForAutoFormatting: /^\*\*\* /,
}

const markdownHorizontalRuleUsingDashes: MarkdownCriteria = {
  ...paragraphStartBase,
  markdownFormatKind: 'horizontalRule',
  regEx: /^---$/,
  regExForAutoFormatting: /^--- /,
}

const markdownInlineCode: MarkdownCriteria = {
  ...autoFormatBase,
  exportFormat: 'code',
  exportTag: '`',
  markdownFormatKind: 'code',
  regEx: /(`)(\s*)([^`]*)(\s*)(`)()/,
  regExForAutoFormatting: /(`)(\s*\b)([^`]*)(\b\s*)(`)(\s)$/,
}

const markdownBold: MarkdownCriteria = {
  ...autoFormatBase,
  exportFormat: 'bold',
  exportTag: '**',
  markdownFormatKind: 'bold',
  regEx: /(\*\*)(\s*)([^*]*)(\s*)(\*\*)()/,
  regExForAutoFormatting: /(\*\*)(\s*\b)([^*]*)(\b\s*)(\*\*)(\s)$/,
}

const markdownItalic: MarkdownCriteria = {
  ...autoFormatBase,
  exportFormat: 'italic',
  exportTag: '*',
  markdownFormatKind: 'italic',
  regEx: /(\*)(\s*)([^*]*)(\s*)(\*)()/,
  regExForAutoFormatting: /(\*)(\s*\b)([^*]*)(\b\s*)(\*)(\s)$/,
}

const markdownBold2: MarkdownCriteria = {
  ...autoFormatBase,
  exportFormat: 'bold',
  exportTag: '_',
  markdownFormatKind: 'bold',
  regEx: /(__)(\s*)([^_]*)(\s*)(__)()/,
  regExForAutoFormatting: /(__)(\s*)([^_]*)(\s*)(__)(\s)$/,
}

const markdownItalic2: MarkdownCriteria = {
  ...autoFormatBase,
  exportFormat: 'italic',
  exportTag: '_',
  markdownFormatKind: 'italic',
  regEx: /(_)()([^_]*)()(_)()/,
  regExForAutoFormatting: /(_)()([^_]*)()(_)(\s)$/, // Maintain 7 groups.
}

const fakeMarkdownUnderline: MarkdownCriteria = {
  ...autoFormatBase,
  exportFormat: 'underline',
  exportTag: '<u>',
  exportTagClose: '</u>',
  markdownFormatKind: 'underline',
  regEx: /(<u>)(\s*)([^<]*)(\s*)(<\/u>)()/,
  regExForAutoFormatting: /(<u>)(\s*\b)([^<]*)(\b\s*)(<\/u>)(\s)$/,
}

const markdownStrikethrough: MarkdownCriteria = {
  ...autoFormatBase,
  exportFormat: 'strikethrough',
  exportTag: '~~',
  markdownFormatKind: 'strikethrough',
  regEx: /(~~)(\s*)([^~]*)(\s*)(~~)()/,
  regExForAutoFormatting: /(~~)(\s*\b)([^~]*)(\b\s*)(~~)(\s)$/,
}

const markdownStrikethroughItalicBold: MarkdownCriteria = {
  ...autoFormatBase,
  markdownFormatKind: 'strikethrough_italic_bold',
  regEx: /(~~_\*\*)(\s*\b)([^*_~]+)(\b\s*)(\*\*_~~)()/,
  regExForAutoFormatting: /(~~_\*\*)(\s*\b)([^*_~]+)(\b\s*)(\*\*_~~)(\s)$/,
}

const markdownItalicbold: MarkdownCriteria = {
  ...autoFormatBase,
  markdownFormatKind: 'italic_bold',
  regEx: /(_\*\*)(\s*\b)([^*_]+)(\b\s*)(\*\*_)/,
  regExForAutoFormatting: /(_\*\*)(\s*\b)([^*_]+)(\b\s*)(\*\*_)(\s)$/,
}

const markdownStrikethroughItalic: MarkdownCriteria = {
  ...autoFormatBase,
  markdownFormatKind: 'strikethrough_italic',
  regEx: /(~~_)(\s*)([^_~]+)(\s*)(_~~)/,
  regExForAutoFormatting: /(~~_)(\s*)([^_~]+)(\s*)(_~~)(\s)$/,
}

const markdownStrikethroughBold: MarkdownCriteria = {
  ...autoFormatBase,
  markdownFormatKind: 'strikethrough_bold',
  regEx: /(~~\*\*)(\s*\b)([^*~]+)(\b\s*)(\*\*~~)/,
  regExForAutoFormatting: /(~~\*\*)(\s*\b)([^*~]+)(\b\s*)(\*\*~~)(\s)$/,
}

const markdownLink: MarkdownCriteria = {
  ...autoFormatBase,
  markdownFormatKind: 'link',
  regEx: /(\[)([^\]]*)(\]\()([^)]*)(\)*)()/,
  regExForAutoFormatting: /(\[)([^\]]*)(\]\()([^)]*)(\)*)(\s)$/,
}

const allMarkdownCriteriaForTextNodes: MarkdownCriteriaArray = [
  // Place the combination formats ahead of the individual formats.
  // Combos
  markdownStrikethroughItalicBold,
  markdownItalicbold,
  markdownStrikethroughItalic,
  markdownStrikethroughBold, // Individuals
  markdownInlineCode,
  markdownBold,
  markdownItalic, // Must appear after markdownBold
  markdownBold2,
  markdownItalic2, // Must appear after markdownBold2.
  fakeMarkdownUnderline,
  markdownStrikethrough,
  markdownLink,
]

const allMarkdownCriteriaForParagraphs: MarkdownCriteriaArray = [
  markdownHeader1,
  markdownHeader2,
  markdownHeader3,
  markdownHeader4,
  markdownHeader5,
  markdownHeader6,
  markdownBlockQuote,
  markdownUnorderedListDash,
  markdownUnorderedListAsterisk,
  markdownOrderedList,
  markdownHorizontalRule,
  markdownHorizontalRuleUsingDashes,
]

export function getAllMarkdownCriteriaForParagraphs(): MarkdownCriteriaArray {
  return allMarkdownCriteriaForParagraphs
}

export function getAllMarkdownCriteriaForTextNodes(): MarkdownCriteriaArray {
  return allMarkdownCriteriaForTextNodes
}

type Block = (
  node: LexicalNode,
  exportChildren: (elementNode: ElementNode) => string,
) => null | string

function createHeadingExport(level: number): Block {
  return (node, exportChildren) => {
    return $isHeadingNode(node) && node.getTag() === 'h' + level
      ? '#'.repeat(level) + ' ' + exportChildren(node)
      : null
  }
}

function listExport(node: LexicalNode, exportChildren: (_node: ElementNode) => string) {
  return $isListNode(node) ? processNestedLists(node, exportChildren, 0) : null
}

// TODO: should be param
const LIST_INDENT_SIZE = 4

function processNestedLists(
  listNode: ListNode,
  exportChildren: (node: ElementNode) => string,
  depth: number,
): string {
  const output: string[] = []
  const children = listNode.getChildren()
  let index = 0

  for (const listItemNode of children) {
    if ($isListItemNode(listItemNode)) {
      if (listItemNode.getChildrenSize() === 1) {
        const firstChild = listItemNode.getFirstChild()

        if ($isListNode(firstChild)) {
          output.push(processNestedLists(firstChild, exportChildren, depth + 1))
          continue
        }
      }

      const indent = ' '.repeat(depth * LIST_INDENT_SIZE)
      const prefix = listNode.getListType() === 'bullet' ? '- ' : `${listNode.getStart() + index}. `
      output.push(indent + prefix + exportChildren(listItemNode))
      index++
    }
  }

  return output.join('\n')
}

function blockQuoteExport(node: LexicalNode, exportChildren: (_node: ElementNode) => string) {
  return $isQuoteNode(node) ? '> ' + exportChildren(node) : null
}

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

export const PUNCTUATION_OR_SPACE = /[!-/:-@[-`{-~\s]/

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
