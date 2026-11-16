import type { RefObject } from 'react'

import type { Theme } from './shared.js'

import { defaultTheme } from './shared.js'

type ThemeTargetState = {
  autoMode: boolean
  highContrastMode: boolean
  theme: null | Theme
}

/** Keeps context synchronized with the target's attributes and inherited values. Does not write attributes. @internal */
export const createThemeTargetStore = ({
  targetRef,
}: {
  targetRef?: RefObject<HTMLElement | null>
}) => {
  const listeners = new Set<() => void>()
  let snapshot: null | ThemeTargetState = null
  let observedNodes: Node[] = []
  let observer: MutationObserver | undefined

  const getSnapshot = (): null | ThemeTargetState => {
    const target = targetRef?.current

    if (!target?.isConnected) {
      snapshot = null
      return snapshot
    }

    const ownTheme = target.getAttribute('data-theme')
    let theme: null | Theme = null
    let highContrastMode = false

    for (const node of getThemeTargetNodes({ target })) {
      if (node.nodeType !== 1) {
        continue
      }

      const element = node as Element
      const value = element.getAttribute('data-theme')

      if (theme === null && (value === 'light' || value === 'dark')) {
        theme = value
      }

      highContrastMode ||= element.hasAttribute('data-enhanced-contrast')
    }

    const autoMode = ownTheme !== 'light' && ownTheme !== 'dark'

    if (
      !snapshot ||
      snapshot.theme !== theme ||
      snapshot.autoMode !== autoMode ||
      snapshot.highContrastMode !== highContrastMode
    ) {
      snapshot = { autoMode, highContrastMode, theme }
    }

    return snapshot
  }

  const refresh = () => {
    const target = targetRef?.current

    // Watch for a deferred target mount until its own inheritance chain is available.
    const nodes = target?.isConnected
      ? getThemeTargetNodes({ target })
      : targetRef
        ? [target?.ownerDocument ?? document]
        : []

    if (
      listeners.size &&
      (nodes.length !== observedNodes.length || nodes.some((node, i) => node !== observedNodes[i]))
    ) {
      observer?.disconnect()
      observedNodes = nodes
      observer = new MutationObserver(refresh)

      for (const node of nodes) {
        observer.observe(
          node,
          node.nodeType === 9
            ? { childList: true, subtree: true }
            : {
                attributeFilter: ['data-theme', 'data-enhanced-contrast'],
                childList: true,
              },
        )
      }
    }

    for (const listener of listeners) {
      listener()
    }
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    refresh()

    return () => {
      listeners.delete(listener)

      if (!listeners.size) {
        observer?.disconnect()
        observedNodes = []
      }
    }
  }

  return { getSnapshot, refresh, subscribe }
}

/** Rejects missing local targets rather than falling through to the document root. @internal */
export const getThemeTarget = ({
  method,
  targetRef,
}: {
  method: 'setHighContrastMode' | 'setTheme'
  targetRef?: RefObject<HTMLElement | null>
}): HTMLElement => {
  if (!targetRef) {
    throw new Error(
      `${method} requires targetRef on ThemeProvider. Wrap the target element with ThemeProvider, update its controlled props instead, or use useRootTheme to change root preferences.`,
    )
  }

  const target = targetRef.current

  if (!target?.isConnected) {
    throw new Error(
      `${method} could not find a mounted target element. Render the element with targetRef inside ThemeProvider before calling its setters.`,
    )
  }

  if (target === target.ownerDocument.documentElement) {
    throw new Error(`${method} cannot target the document root. Use useRootTheme instead.`)
  }

  return target
}

/**
 * Reads the saved theme, falling back to the system preference.
 * Returns the resolved theme and automatic mode without changing document attributes.
 * @internal
 */
export const detectTheme = ({
  cookieKey,
}: {
  cookieKey: string
}): { isAutoMode: boolean; theme: Theme } => {
  const fromCookie = window.document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${cookieKey}=`))
    ?.split('=')[1]

  const theme: Theme =
    fromCookie === 'light' || fromCookie === 'dark' ? fromCookie : getThemeFromSystem()

  return { isAutoMode: fromCookie !== 'light' && fromCookie !== 'dark', theme }
}

/**
 * Reads the saved contrast choice, falling back to the system preference.
 * Does not change document attributes.
 * @internal
 */
export const detectHighContrastMode = ({ cookieKey }: { cookieKey: string }): boolean => {
  const fromCookie =
    window.document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${cookieKey}=`))
      ?.split('=')[1] ?? null

  return fromCookie === 'true'
    ? true
    : fromCookie === 'false'
      ? false
      : !!(window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches)
}

/** Reads the system color-scheme preference, falling back to the default theme when matchMedia is unavailable. @internal */
export const getThemeFromSystem = (): Theme =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : defaultTheme

/** Checks a lowercased query value for an explicit theme or automatic mode. @internal */
export const isValidThemeParam = (value: null | string): value is 'auto' | Theme =>
  value === 'auto' || value === 'light' || value === 'dark'

/** Writes a preference cookie for the given number of days. @internal */
export const setCookie = ({
  cookieKey,
  days,
  value,
}: {
  cookieKey: string
  /** Days from now until expiry. Negative values expire the cookie. */
  days: number
  value: string
}) => {
  const expiresAt = new Date()
  expiresAt.setTime(expiresAt.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + expiresAt.toUTCString()
  document.cookie = cookieKey + '=' + value + ';' + expires + ';path=/'
}

const getThemeTargetNodes = ({ target }: { target: HTMLElement }): Node[] => {
  const nodes: Node[] = []
  let element: Element | null = target

  while (element) {
    nodes.push(element)

    if (element.parentElement) {
      element = element.parentElement
    } else {
      const root = element.getRootNode()

      // Shadow roots inherit theme attributes from their host.
      if ('host' in root) {
        nodes.push(root)
        element = (root as ShadowRoot).host
      } else {
        element = null
      }
    }
  }

  return nodes
}
