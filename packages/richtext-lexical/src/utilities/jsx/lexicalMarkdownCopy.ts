/* eslint-disable regexp/no-unused-capturing-group */

import type { ElementNode } from 'lexical'

import type {
  MultilineElementTransformer as _MultilineElementTransformer,
  Transformer,
} from '../../packages/@lexical/markdown/index.js'

import {
  $convertFromMarkdownString as $originalConvertFromMarkdownString,
  TRANSFORMERS,
} from '../../packages/@lexical/markdown/index.js'

const EMPTY_OR_WHITESPACE_ONLY = /^[\t ]*$/
const ORDERED_LIST_REGEX = /^(\s*)(\d+)\.\s/
const UNORDERED_LIST_REGEX = /^(\s*)[-*+]\s/
const CHECK_LIST_REGEX = /^(\s*)(?:-\s)?\s?(\[(\s|x)?\])\s/i
const HEADING_REGEX = /^(#{1,6})\s/
const QUOTE_REGEX = /^>\s/
const CODE_START_REGEX = /^[ \t]*```(\w+)?/
const CODE_END_REGEX = /[ \t]*```$/
const CODE_SINGLE_LINE_REGEX = /^[ \t]*```[^`]+(?:(?:`{1,2}|`{4,})[^`]+)*```(?:[^`]|$)/
const TABLE_ROW_REG_EXP = /^\|(.+)\|\s?$/
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/
const TAG_START_REGEX = /^[ \t]*<[a-z_][\w-]*(?:\s[^<>]*)?\/?>/i
const TAG_END_REGEX = /^[ \t]*<\/[a-z_][\w-]*\s*>/i

export function normalizeMarkdown(input: string, shouldMergeAdjacentLines = false): string {
  const lines = input.split('\n')
  let inCodeBlock = false
  const sanitizedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lastLine = sanitizedLines[sanitizedLines.length - 1]

    // Code blocks of ```single line``` don't toggle the inCodeBlock flag
    if (CODE_SINGLE_LINE_REGEX.test(line)) {
      sanitizedLines.push(line)
      continue
    }

    if (
      (CODE_START_REGEX.test(line) && !inCodeBlock) ||
      (CODE_END_REGEX.test(line) && inCodeBlock)
    ) {
      inCodeBlock = !inCodeBlock
    }

    // Detect the start or end of a code block
    if (CODE_START_REGEX.test(line) || CODE_END_REGEX.test(line)) {
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
      EMPTY_OR_WHITESPACE_ONLY.test(lastLine) ||
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
      TAG_END_REGEX.test(lastLine)
    ) {
      sanitizedLines.push(line)
    } else {
      sanitizedLines[sanitizedLines.length - 1] = lastLine + ' ' + line.trim()
    }
  }

  return sanitizedLines.join('\n')
}

/**
 * Renders markdown from a string. The selection is moved to the start after the operation.
 *
 *  @param {boolean} [shouldPreserveNewLines] By setting this to true, new lines will be preserved between conversions
 *  @param {boolean} [shouldMergeAdjacentLines] By setting this to true, adjacent non empty lines will be merged according to commonmark spec: https://spec.commonmark.org/0.24/#example-177. Not applicable if shouldPreserveNewLines = true.
 */
export function $convertFromMarkdownString(
  markdown: string,
  transformers: Array<Transformer> = TRANSFORMERS,
  node?: ElementNode,
  shouldPreserveNewLines = false,
  shouldMergeAdjacentLines = true, // Changed from false to true here
): void {
  const sanitizedMarkdown = shouldPreserveNewLines
    ? markdown
    : normalizeMarkdown(markdown, shouldMergeAdjacentLines)

  return $originalConvertFromMarkdownString(sanitizedMarkdown, transformers, node) // shouldPreserveNewLines to true, as we do our own, modified markdown normalization here.
}
