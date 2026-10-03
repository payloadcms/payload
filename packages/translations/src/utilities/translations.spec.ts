import { describe, expect, it } from 'vitest'

import type { GenericTranslationsObject } from '../types.js'

import { translations } from '../exports/all.js'
import { enTranslations } from '../languages/en.js'

const PLACEHOLDER_REGEX = /\{\{.*?\}\}/g

/**
 * Numbered tags rendered by the `<Translation>` component (e.g. `<0>`, `</1>`) and the HTML tags
 * used in email strings (e.g. `<a href="...">`, `<br>`). Angle brackets around plain words such as
 * `<No {{label}}>` are literal text and are intentionally not matched.
 */
const TAG_REGEX = /<\/?(\d+|[abip]|br|code|em|span|strong)(?:\s[^>]*)?\/?>/gi

const PLURAL_SUFFIX_REGEX = /_(zero|one|two|few|many|other)$/

/**
 * Translations that are known to omit a placeholder of the English string.
 * Remove entries once the translation is fixed.
 */
const KNOWN_MISSING_PLACEHOLDERS: Record<string, string[]> = {
  // Needs a native speaker: `general:searchBy` is also split on the first space by the list view search
  my: ['general:filterWhere', 'general:searchBy'],
}

const englishStrings = flattenTranslations({ translationsObject: enTranslations })

describe('translations', () => {
  for (const [language, { translations: languageTranslations }] of Object.entries(translations)) {
    if (language === 'en') {
      continue
    }

    describe(language, () => {
      const languageStrings = flattenTranslations({
        translationsObject: languageTranslations as GenericTranslationsObject,
      })

      it('should not contain empty strings', () => {
        const emptyKeys = Object.keys(languageStrings).filter(
          (key) => !languageStrings[key]?.trim(),
        )

        expect(emptyKeys).toEqual([])
      })

      it('should only use placeholders that exist in the English string', () => {
        const unknownPlaceholders = Object.entries(languageStrings).flatMap(([key, text]) => {
          const englishPlaceholders = getMatches({
            regex: PLACEHOLDER_REGEX,
            text: englishStrings[key],
          })

          return getMatches({ regex: PLACEHOLDER_REGEX, text })
            .filter((placeholder) => !englishPlaceholders.includes(placeholder))
            .map((placeholder) => `${key}: ${placeholder}`)
        })

        expect(unknownPlaceholders).toEqual([])
      })

      it('should keep all placeholders of the English string', () => {
        const missingPlaceholders = Object.entries(languageStrings).flatMap(([key, text]) => {
          if (KNOWN_MISSING_PLACEHOLDERS[language]?.includes(key)) {
            return []
          }

          const placeholders = getMatches({ regex: PLACEHOLDER_REGEX, text })

          return getMatches({ regex: PLACEHOLDER_REGEX, text: englishStrings[key] })
            .filter((placeholder) => !placeholders.includes(placeholder))
            .filter(
              // Singular and dual plural forms may spell out the number instead of using {{count}}
              (placeholder) => !(placeholder === '{{count}}' && PLURAL_SUFFIX_REGEX.test(key)),
            )
            .map((placeholder) => `${key}: ${placeholder}`)
        })

        expect(missingPlaceholders).toEqual([])
      })

      it('should have balanced placeholder braces', () => {
        const unbalancedKeys = Object.keys(languageStrings).filter((key) => {
          const text = languageStrings[key]!

          return (text.match(/\{\{/g)?.length ?? 0) !== (text.match(/\}\}/g)?.length ?? 0)
        })

        expect(unbalancedKeys).toEqual([])
      })

      it('should not contain text that is much longer than the English string', () => {
        // Catches machine translations that returned the translation prompt instead of the string
        const suspiciousKeys = Object.entries(languageStrings)
          .filter(
            ([key, text]) =>
              text.length > 80 && text.length > (englishStrings[key]?.length ?? 0) * 4,
          )
          .map(([key]) => key)

        expect(suspiciousKeys).toEqual([])
      })

      it('should not start with a stray backtick', () => {
        const keysWithBacktick = Object.entries(languageStrings)
          .filter(([key, text]) => text.startsWith('`') && !englishStrings[key]?.startsWith('`'))
          .map(([key]) => key)

        expect(keysWithBacktick).toEqual([])
      })

      it('should keep the tags of the English string', () => {
        const mismatchedKeys = Object.entries(languageStrings)
          .filter(
            ([key, text]) =>
              getTagNames({ text }).join() !== getTagNames({ text: englishStrings[key] }).join(),
          )
          .map(([key]) => key)

        expect(mismatchedKeys).toEqual([])
      })
    })
  }
})

/**
 * Flattens `{ general: { save: 'Save' } }` into `{ 'general:save': 'Save' }`
 */
function flattenTranslations({
  prefix = '',
  translationsObject,
}: {
  prefix?: string
  translationsObject: GenericTranslationsObject
}): Record<string, string> {
  return Object.entries(translationsObject).reduce<Record<string, string>>(
    (flattened, [key, value]) => {
      if (typeof value === 'string') {
        flattened[`${prefix}${key}`] = value
      } else {
        Object.assign(
          flattened,
          flattenTranslations({ prefix: `${prefix}${key}:`, translationsObject: value }),
        )
      }

      return flattened
    },
    {},
  )
}

function getMatches({ regex, text = '' }: { regex: RegExp; text?: string }): string[] {
  return Array.from(text.matchAll(regex), (match) => match[0])
}

function getTagNames({ text = '' }: { text?: string }): string[] {
  return Array.from(
    text.matchAll(TAG_REGEX),
    (match) => `${match[0].startsWith('</') ? '/' : ''}${match[1]!.toLowerCase()}`,
  ).sort()
}
