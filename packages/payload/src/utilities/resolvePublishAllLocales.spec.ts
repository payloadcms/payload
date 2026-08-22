import { describe, expect, it } from 'vitest'

import { resolvePublishAllLocales } from './resolvePublishAllLocales.js'

describe('resolvePublishAllLocales', () => {
  it('should win over draft when publishAllLocalesArg is explicitly true', () => {
    expect(
      resolvePublishAllLocales({
        draft: true,
        hasLocalizeStatusEnabled: true,
        locale: 'en',
        publishAllLocalesArg: true,
      }),
    ).toBe(true)
  })

  it('should be false while saving a draft without an explicit publishAllLocalesArg', () => {
    expect(
      resolvePublishAllLocales({
        draft: true,
        hasLocalizeStatusEnabled: false,
        locale: 'en',
        publishAllLocalesArg: undefined,
      }),
    ).toBe(false)
  })

  it('should default to true for a non-draft save when localize status is disabled', () => {
    expect(
      resolvePublishAllLocales({
        draft: false,
        hasLocalizeStatusEnabled: false,
        locale: 'en',
        publishAllLocalesArg: undefined,
      }),
    ).toBe(true)
  })

  it('should default to false for a non-draft save of one locale when localize status is enabled', () => {
    expect(
      resolvePublishAllLocales({
        draft: false,
        hasLocalizeStatusEnabled: true,
        locale: 'en',
        publishAllLocalesArg: undefined,
      }),
    ).toBe(false)
  })

  it('should default to true when localize status is enabled but locale is "all"', () => {
    expect(
      resolvePublishAllLocales({
        draft: false,
        hasLocalizeStatusEnabled: true,
        locale: 'all',
        publishAllLocalesArg: undefined,
      }),
    ).toBe(true)
  })

  it('should default to false when localize status is enabled and no locale is given, matching create candidates', () => {
    expect(
      resolvePublishAllLocales({
        draft: false,
        hasLocalizeStatusEnabled: true,
        locale: undefined,
        publishAllLocalesArg: undefined,
      }),
    ).toBe(false)
  })

  it('should honor an explicit false publishAllLocalesArg for a non-draft save', () => {
    expect(
      resolvePublishAllLocales({
        draft: false,
        hasLocalizeStatusEnabled: false,
        locale: 'en',
        publishAllLocalesArg: false,
      }),
    ).toBe(false)
  })
})
