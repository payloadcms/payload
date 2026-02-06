'use client'
import type { LexicalEditor } from 'lexical'

import { useCallback } from 'react'

import { PUNCTUATION } from './LexicalTypeaheadMenuPlugin/index.js'

export type TriggerFn = ({
  editor,
  query,
}: {
  editor: LexicalEditor
  /** The query string is the POTENTIAL trigger AND the text after the trigger text. */
  query: string
}) => MenuTextMatch | null

export type MenuTextMatch = {
  leadOffset: number
  matchingString: string
  replaceableString: string
}

/**
 * Returns a function which checks if the trigger (e.g. '/') is present in the query and, if so, returns the matching string (text after the trigger)
 */
export function useMenuTriggerMatch(
  /**
   * Text which triggers the menu. Everything after this text will be used as the query.
   */
  trigger: string,
  { maxLength = 75, minLength = 1 }: { maxLength?: number; minLength?: number },
): TriggerFn {
  return useCallback(
    ({ query }) => {
      const validChars = '[^' + trigger + PUNCTUATION + '\\s]'
      const TypeaheadTriggerRegex = new RegExp(
        '(^|\\s|\\()(' +
          '[' +
          trigger +
          ']' +
          '((?:' +
          validChars +
          '){0,' +
          maxLength +
          '})' +
          ')$',
      )
      const match = TypeaheadTriggerRegex.exec(query)
      if (match !== null) {
        const maybeLeadingWhitespace = match[1]!

        /**
         * matchingString is only the text AFTER the trigger text. (So everything after the /)
         */
        const matchingString = match[3]!

        if (matchingString.length >= minLength) {
          return {
            leadOffset: match.index + maybeLeadingWhitespace.length,
            matchingString,
            replaceableString: match[2]!, // replaceableString is the trigger text + the matching string
          }
        }
      }
      return null
    },
    [maxLength, minLength, trigger],
  )
}
