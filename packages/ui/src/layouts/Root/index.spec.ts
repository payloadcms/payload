import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { getViewportMeta, isIPhoneUserAgent } from './viewport.js'

const h = React.createElement

vi.mock('./getRootLayoutData.js', () => ({
  getRootLayoutData: async () => ({
    dir: 'ltr',
    highContrastMode: false,
    languageCode: 'en',
    suppressHydrationWarning: false,
    theme: 'light',
    themeSource: 'fallback',
  }),
}))

vi.mock('../../exports/client/index.js', () => ({
  DocumentRoot: () => null,
  RootProviders: ({ children }: { children?: React.ReactNode }) => children ?? null,
}))

vi.mock('../../utilities/checkDependencies.js', () => ({
  checkDependencies: () => {},
}))

import { RootLayout } from './index.js'

const config = Promise.resolve({ admin: { components: {} } } as never)

function renderRootLayout() {
  return RootLayout({
    children: h('p', null, 'content'),
    config,
    importMap: { importMapFile: [] },
    initAdminContext: (async () => ({
      cookies: {},
      permissions: null,
      req: {
        headers: new Headers({ 'user-agent': 'Mozilla/5.0 (iPhone)' }),
        i18n: {},
        payload: { config: { admin: {} } },
        server: {},
      },
      user: null,
    })) as never,
    RouterAdapter: ({ children }: { children?: React.ReactNode }) => children ?? null,
    serverFunction: (() => {}) as never,
  })
}

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

  // The Next adapter's `generateViewport` already emits the viewport tag through
  // the framework's metadata API, and the TanStack Start adapter emits it from
  // the route's `head()`. A tag rendered here on top of that is a duplicate, and
  // in Next's dev server it also suspends `<head>` during hydration — so the
  // layout must not hand one down.
  it('does not hand its document a viewport tag of its own', async () => {
    const element = (await renderRootLayout()) as React.ReactElement<{
      viewport?: unknown
    }>

    expect(element.props).not.toHaveProperty('viewport')
  })
})
