import type { SanitizedConfig } from 'payload'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { RequestThemeResult, RequestThemeSource } from '../../utilities/getRequestTheme.js'

import { getRequestTheme } from '../../utilities/getRequestTheme.js'
import { DocumentRoot } from './DocumentRoot.js'
import { getViewportMeta, isIPhoneUserAgent } from './viewport.js'

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

describe('request theme resolution', () => {
  it.each([
    { configTheme: 'dark', cookie: 'light', header: 'light', theme: 'dark', themeSource: 'config' },
    { configTheme: 'all', cookie: 'dark', header: 'light', theme: 'dark', themeSource: 'cookies' },
    { configTheme: 'all', cookie: 'auto', header: 'dark', theme: 'dark', themeSource: 'headers' },
    {
      configTheme: 'all',
      cookie: 'invalid',
      header: 'light',
      theme: 'light',
      themeSource: 'headers',
    },
    { configTheme: 'all', cookie: 'auto', header: null, theme: 'light', themeSource: 'fallback' },
    {
      configTheme: 'all',
      cookie: undefined,
      header: null,
      theme: 'light',
      themeSource: 'fallback',
    },
    {
      configTheme: 'all',
      cookie: 'invalid',
      header: 'invalid',
      theme: 'light',
      themeSource: 'fallback',
    },
  ] satisfies ({
    configTheme: SanitizedConfig['admin']['theme']
    cookie?: string
    header: null | string
  } & RequestThemeResult)[])(
    'should resolve $theme from $themeSource with config=$configTheme, cookie=$cookie, header=$header',
    ({ configTheme, cookie, header, theme, themeSource }) => {
      const config = { admin: { theme: configTheme }, cookiePrefix: 'payload' } as SanitizedConfig
      const cookies = new Map(cookie === undefined ? [] : [['payload-theme', cookie]])
      const headers = new Headers(
        header === null ? undefined : { 'Sec-CH-Prefers-Color-Scheme': header },
      )

      expect(getRequestTheme({ config, cookies, headers })).toEqual({ theme, themeSource })
    },
  )

  it.each(['config', 'cookies', 'fallback', 'headers'] satisfies RequestThemeSource[])(
    'should include pre-paint system resolution only for the fallback source (%s)',
    (themeSource) => {
      const markup = renderToStaticMarkup(
        DocumentRoot({ children: null, theme: 'light', themeSource }),
      )

      expect(markup.includes('prefers-color-scheme')).toBe(themeSource === 'fallback')
    },
  )
})
