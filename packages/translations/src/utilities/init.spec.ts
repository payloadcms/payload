import { describe, expect, it } from 'vitest'

import { translations } from '../exports/all.js'
import { getTranslationString, pluralRulesLocaleByLanguage, t } from './init.js'

const ruTranslations = {
  general: {
    cores_few: '{{count}} ядра',
    cores_many: '{{count}} ядер',
    cores_one: '{{count}} ядро',
    cores_other: '{{count}} ядра',
  },
} as any

const arTranslations = {
  general: {
    items_few: 'few',
    items_many: 'many',
    items_one: 'one',
    items_other: 'other',
    items_two: 'two',
    items_zero: 'zero',
  },
} as any

const enTranslations = {
  general: {
    items_one: '{{count}} item',
    items_other: '{{count}} items',
    items_zero: 'No items',
  },
} as any

const translate = ({
  count,
  key = 'general:cores',
  language,
  translations = ruTranslations,
}: {
  count: number
  key?: string
  language?: string
  translations?: any
}) => t({ key: key as any, language, translations, vars: { count } })

describe('t plural forms', () => {
  describe('with a language', () => {
    it.each([
      [1, '1 ядро'],
      [2, '2 ядра'],
      [5, '5 ядер'],
      [11, '11 ядер'],
      [21, '21 ядро'],
      [22, '22 ядра'],
      [101, '101 ядро'],
      [1.5, '1.5 ядра'],
    ])('should pick the Russian form for %s', (count, expected) => {
      expect(translate({ count, language: 'ru' })).toBe(expected)
    })

    it.each([
      [1, 'one'],
      [2, 'two'],
      [3, 'few'],
      [10, 'few'],
      [11, 'many'],
      [99, 'many'],
      [100, 'other'],
    ])('should pick the Arabic form for %s', (count, expected) => {
      expect(
        translate({ count, key: 'general:items', language: 'ar', translations: arTranslations }),
      ).toBe(expected)
    })

    it.each([
      [0, 'No items'],
      [1, '1 item'],
      [2, '2 items'],
      [5, '5 items'],
      [6, '6 items'],
    ])('should pick the English form for %s', (count, expected) => {
      expect(
        translate({ count, key: 'general:items', language: 'en', translations: enTranslations }),
      ).toBe(expected)
    })

    it('should use the _zero form for 0 when it exists', () => {
      expect(
        translate({ count: 0, key: 'general:items', language: 'ru', translations: enTranslations }),
      ).toBe('No items')
    })

    it('should fall back to _other when the form of the category is missing', () => {
      const translations = {
        general: { cores_one: '{{count}} ядро', cores_other: '{{count}} ядра (other)' },
      }

      expect(translate({ count: 5, language: 'ru', translations })).toBe('5 ядра (other)')
    })

    it('should fall back to the plain key when no plural form exists', () => {
      const translations = { general: { cores: 'ядра' } }

      expect(translate({ count: 5, language: 'ru', translations })).toBe('ядра')
    })

    it('should use Serbian rules for the rs and rs-latin codes', () => {
      const translations = {
        general: { cores_few: 'few', cores_one: 'one', cores_other: 'other' },
      }

      // Serbian: 21 is "one", 22 is "few". English rules would give "other" for both.
      expect(translate({ count: 21, language: 'rs', translations })).toBe('one')
      expect(translate({ count: 22, language: 'rs', translations })).toBe('few')
      expect(translate({ count: 21, language: 'rs-latin', translations })).toBe('one')
      expect(translate({ count: 22, language: 'rs-latin', translations })).toBe('few')
    })

    it('should fall back to the fixed thresholds for an invalid language tag', () => {
      expect(translate({ count: 5, language: '_invalid_', translations: ruTranslations })).toBe(
        '5 ядра',
      )
      expect(translate({ count: 21, language: '_invalid_', translations: ruTranslations })).toBe(
        '21 ядер',
      )
    })

    it('should fall back to the fixed thresholds for a language unknown to Intl', () => {
      // A custom language. `new Intl.PluralRules('xx')` would silently use the default locale.
      expect(translate({ count: 5, language: 'xx', translations: ruTranslations })).toBe('5 ядра')
      expect(translate({ count: 21, language: 'xx', translations: ruTranslations })).toBe('21 ядер')
    })

    it('should not use the _zero form for non-zero counts in the CLDR "zero" category', () => {
      // Latvian puts 10 into the "zero" category, but `_zero` means "nothing"
      expect(
        translate({
          count: 10,
          key: 'general:items',
          language: 'lv',
          translations: enTranslations,
        }),
      ).toBe('10 items')
    })
  })

  describe('without a language', () => {
    it.each([
      [0, '0 ядра'],
      [1, '1 ядро'],
      [2, '2 ядра'],
      [5, '5 ядра'],
      [6, '6 ядер'],
      [21, '21 ядер'],
    ])('should keep the fixed thresholds for %s', (count, expected) => {
      expect(translate({ count })).toBe(expected)
    })

    it('should use the _zero form for 0 when it exists', () => {
      expect(translate({ count: 0, key: 'general:items', translations: enTranslations })).toBe(
        'No items',
      )
    })
  })

  it('should return the key when the namespace is missing', () => {
    expect(translate({ count: 1, key: 'missing:cores', language: 'ru' })).toBe('missing:cores')
    expect(translate({ count: 1, key: 'missing:cores' })).toBe('missing:cores')
  })
})

describe('getTranslationString', () => {
  it('should pick the plural form by the language', () => {
    expect(
      getTranslationString({
        count: 21,
        key: 'general:cores' as any,
        language: 'ru',
        translations: ruTranslations,
      }),
    ).toBe('{{count}} ядро')
  })
})

describe('built-in translations', () => {
  const pluralSuffix = /_(?:few|many|one|other|two|zero)$/

  /**
   * Keys that show the count next to a noun of their own and word it differently per form. A
   * missing form falls back to `_other`, which is fine for the other keys: their forms are
   * identical, show no number, or take the noun from the config through `{{label}}`.
   */
  const getInflectedCountKeys = ({
    namespaceTranslations,
  }: {
    namespaceTranslations: Record<string, unknown>
  }) => {
    const formsByKey = new Map<string, string[]>()

    for (const [key, value] of Object.entries(namespaceTranslations)) {
      if (pluralSuffix.test(key) && typeof value === 'string') {
        const baseKey = key.replace(pluralSuffix, '')
        formsByKey.set(baseKey, [...(formsByKey.get(baseKey) ?? []), value])
      }
    }

    return [...formsByKey]
      .filter(([, forms]) => forms.some((form) => form.includes('{{count}}')))
      .filter(([, forms]) => forms.every((form) => !form.includes('{{label}}')))
      .filter(([, forms]) => new Set(forms).size > 1)
      .map(([key]) => key)
  }

  it.each(Object.keys(translations))('should have Intl plural rules for %s', (language) => {
    // Otherwise `t` silently falls back to the fixed count thresholds for this language
    expect(
      Intl.PluralRules.supportedLocalesOf(pluralRulesLocaleByLanguage[language] ?? language),
    ).toHaveLength(1)
  })

  it.each(Object.entries(translations))(
    'should have a form for each plural category of %s',
    (language, { translations: languageTranslations }) => {
      const pluralRules = new Intl.PluralRules(pluralRulesLocaleByLanguage[language] ?? language)
      // `_zero` means "nothing", other counts in the CLDR "zero" category use `_other`
      const categories = pluralRules
        .resolvedOptions()
        .pluralCategories.filter((category) => category !== 'zero')

      const missingForms: string[] = []

      for (const [namespace, namespaceTranslations] of Object.entries(languageTranslations)) {
        for (const key of getInflectedCountKeys({ namespaceTranslations })) {
          for (const category of categories) {
            if (!(`${key}_${category}` in namespaceTranslations)) {
              missingForms.push(`${namespace}:${key}_${category}`)
            }
          }
        }
      }

      expect(missingForms).toEqual([])
    },
  )
})
