'use client'

import type { HtmlHTMLAttributes, ReactNode } from 'react'

import React from 'react'

import type { Theme } from '../../providers/Theme/shared.js'
import type { RequestThemeSource } from '../../utilities/getRequestTheme.js'

import { defaultTheme } from '../../providers/Theme/shared.js'
import { ResolveThemeOnClient } from './ResolveThemeOnClient.js'

export type RootLayoutFont = {
  className?: string
  variable?: string
}

export type DocumentRootProps = {
  children: ReactNode
  dir?: 'ltr' | 'rtl'
  fonts?: RootLayoutFont[]
  head?: ReactNode
  highContrastMode?: boolean
  htmlProps?: HtmlHTMLAttributes<HTMLHtmlElement>
  languageCode?: string
  suppressHydrationWarning?: boolean
  theme?: Theme
  themeSource?: RequestThemeSource
  /** Optional viewport tag; adapters with router-managed metadata supply it through `head`. */
  viewport?: ReactNode
}

export function DocumentRoot({
  children,
  dir = 'ltr',
  fonts = [],
  head,
  highContrastMode = false,
  htmlProps = {},
  languageCode,
  suppressHydrationWarning = false,
  theme,
  themeSource,
  viewport,
}: DocumentRootProps) {
  const fontClassNames = fonts.map((font) => font.variable ?? font.className).filter(Boolean)

  return (
    <html
      {...htmlProps}
      className={[...fontClassNames, htmlProps.className].filter(Boolean).join(' ')}
      data-enhanced-contrast={highContrastMode ? '' : undefined}
      data-theme={theme}
      dir={dir}
      lang={languageCode}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      <head>
        {viewport}
        <style>{`@layer payload-default, payload;`}</style>
        {head}
      </head>
      <body>
        {/* Rendered in <body>, not <head>, so React does not pair it with scripts a host adds to <head> during hydration */}
        {themeSource === 'default' && <ResolveThemeOnClient serverTheme={theme ?? defaultTheme} />}
        {children}
      </body>
    </html>
  )
}
