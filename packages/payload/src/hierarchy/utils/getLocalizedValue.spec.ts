import { describe, expect, it } from 'vitest'

import { getLocalizedValue } from './getLocalizedValue.js'

describe('getLocalizedValue', () => {
  describe('non-localized values', () => {
    it('should return non-object values as-is', () => {
      expect(getLocalizedValue({ locale: 'en', value: 'Hello' })).toBe('Hello')
      expect(getLocalizedValue({ locale: 'en', value: 123 })).toBe(123)
      expect(getLocalizedValue({ locale: 'en', value: null })).toBe(null)
    })

    it('should return array values as-is', () => {
      const arr = [1, 2, 3]

      expect(getLocalizedValue({ locale: 'en', value: arr })).toBe(arr)
    })
  })

  describe('localized values without fallback', () => {
    it('should return the requested locale value', () => {
      const value = { en: 'Home', es: 'Inicio', de: 'Startseite' }

      expect(getLocalizedValue({ locale: 'en', value })).toBe('Home')
      expect(getLocalizedValue({ locale: 'es', value })).toBe('Inicio')
      expect(getLocalizedValue({ locale: 'de', value })).toBe('Startseite')
    })

    it('should return undefined for missing locale', () => {
      const value = { en: 'Home', es: 'Inicio' }

      expect(getLocalizedValue({ locale: 'fr', value })).toBeUndefined()
    })

    it('should return empty string for text fields', () => {
      const value = { en: 'Home', es: '' }

      expect(getLocalizedValue({ locale: 'es', value })).toBe('')
    })
  })

  describe('localized values with single fallback', () => {
    it('should use fallback when requested locale is undefined', () => {
      const value = { en: 'Home', es: undefined, de: 'Startseite' }

      expect(
        getLocalizedValue({
          fallbackLocale: 'en',
          locale: 'es',
          value,
        }),
      ).toBe('Home')
    })

    it('should use fallback when requested locale is null', () => {
      const value = { en: 'Home', es: null, de: 'Startseite' }

      expect(
        getLocalizedValue({
          fallbackLocale: 'en',
          locale: 'es',
          value,
        }),
      ).toBe('Home')
    })

    it('should use fallback for empty string in text fields', () => {
      const value = { en: 'Home', es: '', de: 'Startseite' }

      expect(
        getLocalizedValue({
          fallbackLocale: 'en',
          fieldType: 'text',
          locale: 'es',
          value,
        }),
      ).toBe('Home')
    })

    it('should NOT use fallback for empty string in non-text fields', () => {
      const value = { en: 'Home', es: '', de: 'Startseite' }

      expect(
        getLocalizedValue({
          fallbackLocale: 'en',
          fieldType: 'select',
          locale: 'es',
          value,
        }),
      ).toBe('')
    })

    it('should return requested value when fallback is disabled', () => {
      const value = { en: 'Home', es: undefined }

      expect(
        getLocalizedValue({
          fallbackLocale: false,
          locale: 'es',
          value,
        }),
      ).toBeUndefined()

      expect(
        getLocalizedValue({
          fallbackLocale: 'null',
          locale: 'es',
          value,
        }),
      ).toBeUndefined()
    })
  })

  describe('localized values with array fallback', () => {
    it('should use first available fallback', () => {
      const value = { en: 'Home', es: undefined, de: 'Startseite', fr: 'Accueil' }

      expect(
        getLocalizedValue({
          fallbackLocale: ['es', 'de', 'fr'],
          locale: 'pt',
          value,
        }),
      ).toBe('Startseite')
    })

    it('should skip empty fallback values for text fields', () => {
      const value = { en: 'Home', es: '', de: 'Startseite', fr: 'Accueil' }

      expect(
        getLocalizedValue({
          fallbackLocale: ['es', 'de', 'fr'],
          fieldType: 'text',
          locale: 'pt',
          value,
        }),
      ).toBe('Startseite')
    })

    it('should return requested value when no fallback has value', () => {
      const value = { en: 'Home', es: undefined, de: undefined, fr: undefined }

      expect(
        getLocalizedValue({
          fallbackLocale: ['es', 'de', 'fr'],
          locale: 'pt',
          value,
        }),
      ).toBeUndefined()
    })

    it('should skip null and undefined fallback values', () => {
      const value = { en: 'Home', es: null, de: undefined, fr: 'Accueil' }

      expect(
        getLocalizedValue({
          fallbackLocale: ['es', 'de', 'fr'],
          locale: 'pt',
          value,
        }),
      ).toBe('Accueil')
    })
  })

  describe('edge cases', () => {
    it('should handle fallback that also has no value', () => {
      const value = { en: undefined, es: 'Inicio' }

      expect(
        getLocalizedValue({
          fallbackLocale: 'en',
          locale: 'fr',
          value,
        }),
      ).toBeUndefined()
    })

    it('should not fallback when value exists and is 0', () => {
      const value = { en: 10, es: 0 }

      expect(
        getLocalizedValue({
          fallbackLocale: 'en',
          fieldType: 'number',
          locale: 'es',
          value,
        }),
      ).toBe(0)
    })

    it('should not fallback when value exists and is false', () => {
      const value = { en: true, es: false }

      expect(
        getLocalizedValue({
          fallbackLocale: 'en',
          fieldType: 'checkbox',
          locale: 'es',
          value,
        }),
      ).toBe(false)
    })
  })
})
