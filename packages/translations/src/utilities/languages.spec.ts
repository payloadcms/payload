import { describe, expect, it } from 'vitest'

import { extractHeaderLanguage } from './languages.js'

describe('extractHeaderLanguage', () => {
  it('should return exact match when base language tag is supported', () => {
    expect(extractHeaderLanguage('ja')).toBe('ja')
    expect(extractHeaderLanguage('en')).toBe('en')
    expect(extractHeaderLanguage('de')).toBe('de')
  })

  it('should fall back to base tag when regional tag has no exact match', () => {
    expect(extractHeaderLanguage('ja-JP')).toBe('ja')
    expect(extractHeaderLanguage('de-AT')).toBe('de')
    expect(extractHeaderLanguage('fr-BE')).toBe('fr')
  })

  it('should match exact regional tag when it is supported', () => {
    // zh-TW is in acceptedLanguages, so it should match directly
    expect(extractHeaderLanguage('zh-TW')).toBe('zh-TW')
    // bn-BD is in acceptedLanguages
    expect(extractHeaderLanguage('bn-BD')).toBe('bn-BD')
  })

  it('should fall back to base tag for unsupported regional variant of a supported regional language', () => {
    // zh-CN is not in acceptedLanguages, but zh is
    expect(extractHeaderLanguage('zh-CN')).toBe('zh')
  })

  it('should return undefined for unsupported languages', () => {
    expect(extractHeaderLanguage('xx')).toBeUndefined()
    expect(extractHeaderLanguage('xx-XX')).toBeUndefined()
  })

  it('should respect quality ordering and return highest quality supported language', () => {
    expect(extractHeaderLanguage('ja-JP;q=0.9, en;q=1.0')).toBe('en')
    expect(extractHeaderLanguage('ja-JP, en;q=0.9')).toBe('ja')
  })

  it('should skip unsupported languages and find the next supported one', () => {
    expect(extractHeaderLanguage('xx-XX, ja-JP')).toBe('ja')
    expect(extractHeaderLanguage('xx, yy, de-DE')).toBe('de')
  })

  it('should handle empty string', () => {
    // empty string produces one entry with empty language, which won't match
    expect(extractHeaderLanguage('')).toBeUndefined()
  })
})
