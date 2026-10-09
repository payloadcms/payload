import { describe, expect, it } from 'vitest'

import { t } from './init.js'

const translations = {
  general: {
    itemCount_few: '{{count}} items (few)',
    itemCount_one: '{{count}} item',
    itemCount_other: '{{count}} items',
  },
} as any

describe('t', () => {
  it('should return the key when its namespace is missing for the active language, with or without a count', () => {
    expect(t({ key: 'some-plugin:totalImageCount' as any, translations, vars: { count: 2 } })).toBe(
      'some-plugin:totalImageCount',
    )
    expect(t({ key: 'some-plugin:totalImageCount' as any, translations })).toBe(
      'some-plugin:totalImageCount',
    )
  })

  it('should pick the singular variant and interpolate the count', () => {
    expect(t({ key: 'general:itemCount' as any, translations, vars: { count: 1 } })).toBe('1 item')
  })

  it('should pick the few variant for counts between three and five', () => {
    expect(t({ key: 'general:itemCount' as any, translations, vars: { count: 4 } })).toBe(
      '4 items (few)',
    )
  })

  it('should fall back to the other variant when no closer plural form exists', () => {
    expect(t({ key: 'general:itemCount' as any, translations, vars: { count: 12 } })).toBe(
      '12 items',
    )
  })
})
