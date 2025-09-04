/* eslint-disable regexp/no-unused-capturing-group */

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
