import type { SanitizedConfig } from 'payload'

import { describe, expect, it } from 'vitest'

import { getRequestTheme } from './getRequestTheme.js'

describe('getRequestTheme', () => {
  it.each([
    {
      theme: 'dark',
      cookie: 'light',
      header: 'light',
      expectedTheme: 'dark',
      themeSource: 'config',
    },
    {
      theme: 'light',
      cookie: 'dark',
      header: 'dark',
      expectedTheme: 'light',
      themeSource: 'config',
    },
    { theme: 'all', cookie: 'dark', header: 'light', expectedTheme: 'dark', themeSource: 'cookie' },
    {
      theme: 'all',
      cookie: { value: 'light' },
      header: 'dark',
      expectedTheme: 'light',
      themeSource: 'cookie',
    },
    {
      theme: 'all',
      cookie: 'invalid',
      header: 'dark',
      expectedTheme: 'dark',
      themeSource: 'header',
    },
    {
      theme: 'all',
      cookie: undefined,
      header: 'light',
      expectedTheme: 'light',
      themeSource: 'header',
    },
    {
      theme: 'all',
      cookie: undefined,
      header: null,
      expectedTheme: 'light',
      themeSource: 'default',
    },
    {
      theme: 'all',
      cookie: 'invalid',
      header: 'unsupported',
      expectedTheme: 'light',
      themeSource: 'default',
    },
  ])(
    'should resolve $expectedTheme from $themeSource with theme=$theme, cookie=$cookie, header=$header',
    ({ theme, cookie, header, expectedTheme, themeSource }) => {
      const config = { admin: { theme }, cookiePrefix: 'custom' } as SanitizedConfig
      const cookies = new Map([['custom-theme', cookie]])
      const headers = new Headers(header ? { 'Sec-CH-Prefers-Color-Scheme': header } : {})

      expect(getRequestTheme({ config, cookies: cookies as Map<string, string>, headers })).toEqual(
        {
          theme: expectedTheme,
          themeSource,
        },
      )
    },
  )
})
