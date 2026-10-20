import { describe, expect, it } from 'vitest'

import { translations } from './exports/all.js'

type TranslationValue = { [key: string]: TranslationValue } | string

/**
 * Keys that are already broken in other languages and still need a fix.
 * Remove entries from this list as they get fixed - do not add new ones.
 */
const knownIssues: Record<string, string[]> = {
  ar: ['authentication:generatingNewAPIKeyWillInvalidate', 'general:schedulePublishFor'],
  az: [
    'authentication:generatingNewAPIKeyWillInvalidate',
    'authentication:loggedIn',
    'authentication:loggedInChangePassword',
    'authentication:loginWithAnotherUser',
  ],
  ca: ['general:aboutToPermanentlyDelete'],
  fa: [
    'general:aboutToDelete',
    'general:aboutToPermanentlyDelete',
    'general:aboutToRestore',
    'general:aboutToRestoreAsDraft',
    'general:aboutToTrash',
  ],
  fr: ['general:schedulePublishFor', 'version:noRowsSelected'],
  he: [
    'authentication:generatingNewAPIKeyWillInvalidate',
    'authentication:loggedIn',
    'authentication:loggedInChangePassword',
    'general:schedulePublishFor',
    'version:noRowsSelected',
  ],
  hr: ['version:noRowsSelected'],
  hu: ['general:movingCount', 'general:showAllLabel', 'upload:sizesFor', 'version:noRowsSelected'],
  hy: ['general:updatedLabelSuccessfully', 'general:updateForEveryone'],
  id: ['general:newLabel'],
  it: ['version:noRowsSelected'],
  ko: ['authentication:generatingNewAPIKeyWillInvalidate'],
  nb: ['localization:copyFromTo'],
  pt: ['version:noRowsSelected'],
  ro: [
    'general:movingCount',
    'general:showAllLabel',
    'general:sortByLabelDirection',
    'version:noRowsSelected',
  ],
  rs: ['general:sortByLabelDirection', 'validation:longerThanMin'],
  sk: ['version:noRowsSelected'],
  sl: ['general:schedulePublishFor'],
  ta: ['authentication:notRedirected'],
  tr: ['authentication:newAccountCreated', 'validation:invalidBlocks'],
}

const pluralSuffix = /_(zero|one|two|few|many|other|none)$/

const flattenTranslations = ({
  prefix = '',
  value,
}: {
  prefix?: string
  value: TranslationValue
}): [string, string][] => {
  if (typeof value === 'string') {
    return [[prefix, value]]
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    flattenTranslations({ prefix: prefix ? `${prefix}:${key}` : key, value: nested }),
  )
}

const getPlaceholders = (value: string): string[] =>
  [...value.matchAll(/\{\{\s*(.+?)\s*\}\}/g)].map((match) => match[1]!)

const getComponentTags = (value: string): string =>
  [...value.matchAll(/<\/?\d+>/g)]
    .map((match) => match[0])
    .sort()
    .join('')

const englishTranslations = flattenTranslations({
  value: translations.en!.translations as TranslationValue,
})
const englishValues = new Map(englishTranslations)

/** Placeholders allowed per key, merged across plural forms (e.g. `item_one` and `item_other`) */
const englishPlaceholders = new Map<string, Set<string>>()
for (const [key, value] of englishTranslations) {
  const baseKey = key.replace(pluralSuffix, '')
  const placeholders = englishPlaceholders.get(baseKey) ?? new Set<string>()
  getPlaceholders(value).forEach((placeholder) => placeholders.add(placeholder))
  englishPlaceholders.set(baseKey, placeholders)
}

const languagesToCheck = Object.entries(translations).filter(
  ([languageCode]) => languageCode !== 'en',
)

describe('translations consistency with English', () => {
  it.each(languagesToCheck)(
    '%s should only use placeholders and tags that exist in English',
    (languageCode, language) => {
      const problems: string[] = []
      const ignoredKeys = new Set(knownIssues[languageCode] ?? [])

      for (const [key, value] of flattenTranslations({
        value: language!.translations as TranslationValue,
      })) {
        if (ignoredKeys.has(key) || key === '$schema') {
          continue
        }

        const allowedPlaceholders = englishPlaceholders.get(key.replace(pluralSuffix, ''))

        if (!allowedPlaceholders) {
          problems.push(`${key}: key does not exist in English`)
          continue
        }

        for (const placeholder of getPlaceholders(value)) {
          if (!allowedPlaceholders.has(placeholder)) {
            problems.push(`${key}: unknown placeholder {{${placeholder}}}`)
          }
        }

        // A plural form English does not have (e.g. `_few`) is compared with English `_other`
        const englishValue =
          englishValues.get(key) ?? englishValues.get(`${key.replace(pluralSuffix, '')}_other`)

        if (englishValue === undefined) {
          continue
        }

        if (getComponentTags(value) !== getComponentTags(englishValue)) {
          problems.push(`${key}: component tags differ from English`)
        }

        if (value.trim() === '' && englishValue.trim() !== '') {
          problems.push(`${key}: translation is empty`)
        }
      }

      expect(problems).toStrictEqual([])
    },
  )
})
