import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { RootLayout } from './index.js'
import { ResolveThemeOnClient } from './ResolveThemeOnClient.js'
import { getViewportMeta, isIPhoneUserAgent } from './viewport.js'
import { getRequestTheme, getRequestThemeWithSource } from '../../utilities/getRequestTheme.js'

vi.mock('payload/shared', () => ({ applyLocaleFiltering: vi.fn() }))
vi.mock('../../elements/Nav/getNavPrefs.js', () => ({
  getNavPrefs: vi.fn().mockResolvedValue({ open: true }),
}))
vi.mock('../../exports/client/index.js', () => ({
  ProgressBar: () => null,
  RootProvider: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock('../../utilities/checkDependencies.js', () => ({ checkDependencies: vi.fn() }))
vi.mock('../../utilities/getClientConfig.js', () => ({
  getClientConfig: ({ config }: { config: unknown }) => config,
}))
vi.mock('./NestProviders.js', () => ({
  NestProviders: ({ children }: { children: React.ReactNode }) => children,
}))

const runResolveThemeOnClient = ({
  prefersDark = false,
  serverTheme = 'light',
}: {
  prefersDark?: boolean
  serverTheme?: 'dark' | 'light'
}) => {
  const element = ResolveThemeOnClient({ serverTheme })
  const script = element.props.dangerouslySetInnerHTML.__html as string
  const attributes = new Map<string, string>()

  Function(
    'document',
    'window',
    script,
  )(
    {
      documentElement: {
        setAttribute: (name: string, value: string) => attributes.set(name, value),
      },
    },
    {
      matchMedia: () => ({ matches: prefersDark }),
    },
  )

  return { attributes, script }
}

describe('RootLayout', () => {
  it.each([
    { configuredTheme: 'all', expectedServerTheme: 'light', shouldResolveOnClient: true },
    { configuredTheme: 'dark', expectedServerTheme: 'dark', shouldResolveOnClient: false },
  ] as const)(
    'should conditionally resolve the $configuredTheme theme on the client',
    async ({ configuredTheme, expectedServerTheme, shouldResolveOnClient }) => {
      const config = {
        admin: {
          components: { providers: [] },
          suppressHydrationWarning: false,
          theme: configuredTheme,
        },
        cookiePrefix: 'custom',
        i18n: {
          fallbackLanguage: 'en',
          supportedLanguages: {
            en: { translations: { general: { thisLanguage: 'English' } } },
          },
        },
      }
      const props = {
        children: null,
        config: Promise.resolve(config),
        importMap: {},
        initAdminContext: async () => ({
          cookies: new Map(),
          headers: new Headers(),
          languageCode: 'en',
          permissions: {},
          req: {
            i18n: { dateFNSKey: 'en', translations: {} },
            locale: 'en',
            payload: { config, importMap: {} },
            server: '',
          },
          user: null,
        }),
        RouterAdapter: ({ children }: { children: React.ReactNode }) => children,
        serverFunction: async () => null,
      } as unknown as Parameters<typeof RootLayout>[0]

      const content = RootLayout(props) as React.ReactElement<Record<string, unknown>>
      const renderContent = content.type as (
        props: Record<string, unknown>,
      ) => Promise<
        React.ReactElement<{ children: React.ReactNode; suppressHydrationWarning: boolean }>
      >
      const html = await renderContent(content.props)
      const [head] = React.Children.toArray(html.props.children) as React.ReactElement<{
        children: React.ReactNode
      }>[]
      const resolveThemeOnClient = React.Children.toArray(head.props.children).find(
        (child) => React.isValidElement(child) && child.type === ResolveThemeOnClient,
      ) as React.ReactElement<{ serverTheme: string }> | undefined

      if (shouldResolveOnClient) {
        expect(resolveThemeOnClient?.props).toEqual({ serverTheme: expectedServerTheme })
      } else {
        expect(resolveThemeOnClient).toBeUndefined()
      }

      expect(html.props.suppressHydrationWarning).toBe(configuredTheme === 'all')
    },
  )

  it.each([
    { expectedTheme: 'dark', prefersDark: true },
    { expectedTheme: 'light', prefersDark: false },
  ])('should initialize a dynamic $expectedTheme theme from the OS preference', (testCase) => {
    const { attributes } = runResolveThemeOnClient({
      prefersDark: testCase.prefersDark,
    })

    expect(attributes.get('data-theme')).toBe(testCase.expectedTheme)
  })

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

describe('getRequestThemeWithSource', () => {
  it.each([
    {
      configuredTheme: 'dark',
      cookieTheme: 'light',
      expected: { source: 'config', theme: 'dark' },
      headerTheme: 'light',
    },
    {
      configuredTheme: 'all',
      cookieTheme: 'light',
      expected: { source: 'cookie', theme: 'light' },
      headerTheme: 'dark',
    },
    {
      configuredTheme: 'all',
      cookieTheme: 'auto',
      expected: { source: 'header', theme: 'dark' },
      headerTheme: 'dark',
    },
    {
      configuredTheme: 'all',
      cookieTheme: undefined,
      expected: { source: 'header', theme: 'dark' },
      headerTheme: 'dark',
    },
    {
      configuredTheme: 'all',
      cookieTheme: undefined,
      expected: { source: 'default', theme: 'light' },
      headerTheme: 'sepia',
    },
    {
      configuredTheme: 'all',
      cookieTheme: undefined,
      expected: { source: 'default', theme: 'light' },
      headerTheme: undefined,
    },
  ] as const)(
    'should resolve the $expected.source theme with its source',
    ({ configuredTheme, cookieTheme, expected, headerTheme }) => {
      const cookies = new Map<string, string>()
      const headers = new Headers()

      if (cookieTheme) {
        cookies.set('custom-theme', cookieTheme)
      }

      if (headerTheme) {
        headers.set('Sec-CH-Prefers-Color-Scheme', headerTheme)
      }

      const result = getRequestThemeWithSource({
        config: {
          admin: { theme: configuredTheme },
          cookiePrefix: 'custom',
        } as Parameters<typeof getRequestThemeWithSource>[0]['config'],
        cookies,
        headers,
      })

      expect(result).toEqual(expected)
    },
  )

  it('should preserve the getRequestTheme return value', () => {
    const theme = getRequestTheme({
      config: {
        admin: { theme: 'all' },
        cookiePrefix: 'custom',
      } as Parameters<typeof getRequestTheme>[0]['config'],
      cookies: new Map([['custom-theme', 'dark']]),
      headers: new Headers(),
    })

    expect(theme).toBe('dark')
  })
})
