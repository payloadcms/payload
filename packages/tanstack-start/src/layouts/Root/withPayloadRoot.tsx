'use client'
import { rtlLanguages } from '@payloadcms/translations'
import { HeadContent, Scripts, useRouterState } from '@tanstack/react-router'
import React from 'react'

/**
 * Builds the blocking inline script that sets `data-theme`, `lang`, and `dir`
 * on `<html>` synchronously, before first paint, from Payload's theme and
 * language cookies. This is the no-flash equivalent of what `RootProvider`'s
 * `ThemeProvider` does in a post-hydration effect, hoisted into the SSR'd
 * document head so the admin panel never flashes light mode (or LTR for RTL
 * locales) on the first render. Mirrors `detectTheme` in
 * `@payloadcms/ui`'s `ThemeProvider`.
 */
export function buildThemeInitScript(cookiePrefix: string = 'payload'): string {
  const rtl = JSON.stringify(rtlLanguages)
  return `(function(){try{var d=document.documentElement;var c=document.cookie.split('; ');function r(n){var row=c.find(function(x){return x.indexOf(n+'=')===0});return row?row.split('=')[1]:null}var t=r('${cookiePrefix}-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.setAttribute('data-theme',t);var l=r('${cookiePrefix}-lng');if(l){d.setAttribute('lang',l);d.setAttribute('dir',${rtl}.indexOf(l)!==-1?'rtl':'ltr')}}catch(e){}})()`
}

/**
 * The no-flash theme bootstrap script for the default (`payload`) cookie
 * prefix. Inline this in a `<script dangerouslySetInnerHTML>` inside the
 * document `<head>` to set `data-theme`/`lang`/`dir` before first paint.
 */
export const THEME_INIT_SCRIPT: string = buildThemeInitScript()

/**
 * The Payload admin head `<style>`: declares the `@layer` order and hides
 * closed modals from first paint.
 *
 * `@faceless-ui/modal` hides closed modals with CSS it injects from a
 * client-side `<style>` tag (its `generateCSS`), so those rules are absent
 * during SSR and the first hydration frames. Because `@payloadcms/ui`'s
 * `dialog` styles render modals regardless of the `open` attribute, any
 * registered-but-closed modal (e.g. the delete confirmation or stay-logged-in
 * dialogs) would flash on screen after a refresh until that `<style>` mounts.
 * Next.js doesn't hit this, but TanStack Start's hydration exposes the gap —
 * the same reason the theme bootstrap above is hoisted into the SSR'd head. So
 * ship faceless-ui's visibility rules here too, present at first paint, so
 * closed modals stay hidden until they actually open.
 */
export const PAYLOAD_HEAD_STYLE: string =
  `@layer payload-default, payload;` +
  `@layer payload-default{` +
  `.payload__modal-container,.payload__modal-item{visibility:hidden}` +
  `.payload__modal-container--appear,.payload__modal-container--appearDone,` +
  `.payload__modal-container--enter,.payload__modal-container--enterDone,` +
  `.payload__modal-container--exit,.payload__modal-item--appear,` +
  `.payload__modal-item--appearDone,.payload__modal-item--enter,` +
  `.payload__modal-item--enterDone,.payload__modal-item--exit{visibility:visible}` +
  `}`

export type PayloadAdminShellProps = {
  readonly children: React.ReactNode
  /**
   * The `config.cookiePrefix` used to read the theme/language cookies in the
   * no-flash bootstrap script. Defaults to `'payload'`.
   */
  readonly cookiePrefix?: string
}

/**
 * The `<html>` document shell for Payload admin routes — the TanStack Start
 * equivalent of `@payloadcms/next`'s root layout `<html>`. Owns the no-flash
 * theme script, the `@layer` ordering style, `@payloadcms/ui` styles,
 * `<HeadContent />`, and `<Scripts />`. Render `RootProvider` (and the rest of
 * the admin tree) as `children`.
 */
export function PayloadAdminShell({ children, cookiePrefix }: PayloadAdminShellProps) {
  const themeInitScript = cookiePrefix ? buildThemeInitScript(cookiePrefix) : THEME_INIT_SCRIPT

  return (
    // `lang`/`dir` are set on `<html>` by `themeInitScript` before first paint
    // from the `*-lng` cookie, so a static `lang` here would be incorrect.
    // eslint-disable-next-line jsx-a11y/html-has-lang -- set dynamically by the inline bootstrap script
    <html suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style>{PAYLOAD_HEAD_STYLE}</style>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

export type WithPayloadRootOptions = {
  /**
   * Path prefix that mounts the Payload admin panel (`config.routes.admin`).
   * Routes under it render the Payload admin document shell; everything else
   * renders your own shell. Defaults to `'/admin'`.
   */
  adminRoute?: string
  /**
   * The `config.cookiePrefix` used by the no-flash theme bootstrap script.
   * Defaults to `'payload'`.
   */
  cookiePrefix?: string
}

/**
 * Wraps your application's root document shell so Payload owns its own
 * `<html>` chrome on admin routes while your shell renders everywhere else.
 *
 * Attach the result to the root route's `shellComponent`; it is the single
 * integration touch point — no root loader and no manual data threading:
 *
 * ```tsx
 * export const Route = createRootRoute({
 *   shellComponent: withPayloadRoot(MarketingRoot),
 * })
 * ```
 */
export function withPayloadRoot(
  RootShell: React.ComponentType<{ children: React.ReactNode }>,
  options: WithPayloadRootOptions = {},
) {
  const { adminRoute = '/admin', cookiePrefix } = options

  return function PayloadRootShell({ children }: { children: React.ReactNode }) {
    const isAdminRoute = useRouterState({
      select: (s) => {
        const { pathname } = s.location
        return pathname === adminRoute || pathname.startsWith(`${adminRoute}/`)
      },
    })

    if (isAdminRoute) {
      return <PayloadAdminShell cookiePrefix={cookiePrefix}>{children}</PayloadAdminShell>
    }

    return <RootShell>{children}</RootShell>
  }
}
