import { describe, expect, it } from 'vitest'

import { getViewportMeta, isIPhoneUserAgent } from './viewport.js'
import { getRequestTheme } from '../../utilities/getRequestTheme.js'

describe('RootLayout', () => {
  it('should apply the focus zoom viewport workaround to iPhone user agents only', () => {
    const iPhoneUserAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    const androidUserAgent =
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

    expect(isIPhoneUserAgent(iPhoneUserAgent)).toBe(true)
    expect(isIPhoneUserAgent(androidUserAgent)).toBe(false)
    expect(isIPhoneUserAgent(undefined)).toBe(false)
    expect(getViewportMeta(iPhoneUserAgent).props).toEqual({
      content: 'width=device-width, initial-scale=1, maximum-scale=1',
      name: 'viewport',
    })
    expect(getViewportMeta(androidUserAgent).props).toEqual({
      content: 'width=device-width, initial-scale=1',
      name: 'viewport',
    })
  })
})

describe('getRequestTheme', () => {
  it.each([
    {
      configuredTheme: 'dark',
      cookieTheme: 'light',
      expected: { theme: 'dark', themeSource: 'config' },
      headerTheme: 'light',
    },
    {
      configuredTheme: 'all',
      cookieTheme: 'light',
      expected: { theme: 'light', themeSource: 'cookie' },
      headerTheme: 'dark',
    },
    {
      configuredTheme: 'all',
      cookieTheme: 'auto',
      expected: { theme: 'dark', themeSource: 'header' },
      headerTheme: 'dark',
    },
    {
      configuredTheme: 'all',
      cookieTheme: undefined,
      expected: { theme: 'dark', themeSource: 'header' },
      headerTheme: 'dark',
    },
    {
      configuredTheme: 'all',
      cookieTheme: undefined,
      expected: { theme: 'light', themeSource: 'default' },
      headerTheme: 'sepia',
    },
    {
      configuredTheme: 'all',
      cookieTheme: undefined,
      expected: { theme: 'light', themeSource: 'default' },
      headerTheme: undefined,
    },
  ] as const)(
    'should resolve the $expected.themeSource theme with its source',
    ({ configuredTheme, cookieTheme, expected, headerTheme }) => {
      const cookies = new Map<string, string>()
      const headers = new Headers()

      if (cookieTheme) {
        cookies.set('custom-theme', cookieTheme)
      }

      if (headerTheme) {
        headers.set('Sec-CH-Prefers-Color-Scheme', headerTheme)
      }

      const result = getRequestTheme({
        config: {
          admin: { theme: configuredTheme },
          cookiePrefix: 'custom',
        } as Parameters<typeof getRequestTheme>[0]['config'],
        cookies,
        headers,
      })

      expect(result).toEqual(expected)
    },
  )
})
