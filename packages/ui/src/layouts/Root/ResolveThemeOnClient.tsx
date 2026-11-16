import type { Theme } from '../../providers/Theme/shared.js'

type ResolveThemeOnClientProps = {
  serverTheme: Theme
}

/** Serializes a value for safe interpolation into an inline script. */
const serialize = (value: string): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

/**
 * Resolves the preferred theme before first paint when the server cannot.
 * Some browsers omit `Sec-CH-Prefers-Color-Scheme`, so root layouts render this
 * blocking script to detect the user's preference with `window.matchMedia`.
 */
export const ResolveThemeOnClient = ({ serverTheme }: ResolveThemeOnClientProps) => {
  const serializedServerTheme = serialize(serverTheme)

  const script = `
    (function () {
      try {
        var documentElement = document.documentElement
        var resolvedTheme = ${serializedServerTheme}

        if (window.matchMedia) {
          resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
        }

        documentElement.setAttribute('data-theme', resolvedTheme)
      } catch (error) {}
    })()
  `

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
