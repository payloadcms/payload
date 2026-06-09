import type { PluginOption } from 'vite'

const STYLE_EXTENSION_RE = /\.(?:s?css|less)$/i

/**
 * Static `import './foo.css'` (or .scss/.less) — top-level only.
 * Captures the entire statement so we can replace it with an empty line.
 *
 * Matches:
 *   import './foo.css';
 *   import "../bar.scss"
 *   import   './baz.less' ;
 */
const STATIC_STYLE_IMPORT_RE = /^[ \t]*import\s+['"][^'"]+\.(?:s?css|less)['"]\s*(?:;[ \t]*)?$/gm

/**
 * Monorepo Payload package source, e.g. `…/packages/ui/src/…`. In the
 * core-dev / test setup Payload packages resolve to their workspace `src`
 * (not a published `dist`), so the `dist/` rule below doesn't cover them and
 * their `.css` side-effect imports survive into the SSR/RSC graph.
 */
const PAYLOAD_PKG_SRC_RE = /\/packages\/[^/]+\/src\//

/**
 * Stops Vite (and the underlying Node ESM loader) from trying to load
 * SCSS/CSS/LESS during SSR/RSC when the importer lives inside a built
 * `dist/` directory or when the specifier is a bare package name.
 *
 * We do this two ways, because either layer can fail:
 *
 * 1. `resolveId` redirects style specifiers to a virtual empty module —
 *    handles cases where Vite asks us to resolve them.
 * 2. `transform` strips top-level `import './x.css'` statements out of any
 *    JS/TS file living under `node_modules/.../dist/` for non-client envs.
 *    This is the bulletproof path for prod-packed `@payloadcms/ui` (and
 *    similar) dependencies that get pre-bundled by Vite's SSR/RSC dep
 *    optimizer (esbuild). Esbuild preserves `.css` import statements as-is,
 *    and Node's native ESM loader then crashes with
 *    `Unknown file extension ".css"`. Removing them at the source avoids
 *    that entirely.
 */
export function ssrStripDistStyleImports(): PluginOption {
  return {
    name: 'payload:ssr-strip-dist-style-imports',
    enforce: 'pre',
    load(id) {
      if (id === '\0ssr-empty-style') {
        return ''
      }
    },
    resolveId(id, importer, options) {
      const isServerEnv =
        options?.ssr || ((this as any).environment && (this as any).environment.name !== 'client')
      if (!isServerEnv) {
        return
      }
      if (!STYLE_EXTENSION_RE.test(id)) {
        return
      }
      if (importer && (/\/dist\//.test(importer) || PAYLOAD_PKG_SRC_RE.test(importer))) {
        return '\0ssr-empty-style'
      }
      if (/^@?[a-z]/.test(id) && !id.startsWith('.') && !id.startsWith('/')) {
        return '\0ssr-empty-style'
      }
    },
    transform(code, id) {
      const isServerEnv = (this as any).environment && (this as any).environment.name !== 'client'
      if (!isServerEnv) {
        return
      }
      // Only touch Payload dependency files: published `node_modules/.../dist/`
      // builds, or workspace `…/packages/<pkg>/src/…` sources in the core-dev /
      // test setup. Don't strip from the consumer's own app source — devs may
      // legitimately want SSR-rendered <link>s from their own CSS imports.
      const isPayloadDistFile = /\/node_modules\//.test(id) && /\/dist\//.test(id)
      const isPayloadSrcFile = PAYLOAD_PKG_SRC_RE.test(id)
      if (!isPayloadDistFile && !isPayloadSrcFile) {
        return
      }
      if (!/\.[mc]?[jt]sx?$/.test(id)) {
        return
      }
      if (!STATIC_STYLE_IMPORT_RE.test(code)) {
        STATIC_STYLE_IMPORT_RE.lastIndex = 0
        return
      }
      STATIC_STYLE_IMPORT_RE.lastIndex = 0
      const stripped = code.replace(STATIC_STYLE_IMPORT_RE, '')
      return { code: stripped, map: null }
    },
  }
}
