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
 * The version-diff component trees — matched in either published `dist/` or
 * workspace `src/` form. The `.css` side-effect imports of these must be
 * stripped in the RSC env (the rest of `@payloadcms/ui` must NOT be — see the
 * note in `resolveId`/`transform` below), for two reasons rooted in the same
 * `@vitejs/plugin-rsc` behaviour: it wraps every exported CSS-importing
 * component with an async CSS-collector child
 * (`__vite_rsc_wrap_css__` → `await import('virtual:vite-rsc/css?…')`).
 *
 * 1. Correctness: the diff converters render `CheckIcon` (`icons/*`) and `File`
 *    (`graphics/*`) through the SYNCHRONOUS `renderToStaticMarkup` (see
 *    `reactDomServerInRsc`). The async wrapper suspends, crashing that render
 *    with "A component suspended while responding to synchronous input" and
 *    taking down the entire field-diffs tree.
 * 2. Performance: the diff view (`views/Version/*` — `RenderFieldsToDiff` and
 *    its per-field components, `DiffCollapser`, `SelectComparison`, the
 *    `Default` template — plus the `HTMLDiff`/`FieldDiffContainer`/
 *    `FieldDiffLabel` elements and lexical's `field/Diff/*`) renders dozens of
 *    these wrapped components in the Flight stream. Each async CSS import
 *    serializes a round-trip, ballooning the render from ~3s to ~25s and
 *    blowing past the e2e waits. Stripping them collapses it back to ~3s.
 *
 * Safe because every one of these components' styles also ship in the global
 * `@payloadcms/ui/scss/app.scss` the admin imports, so dropping the per-module
 * RSC collection here changes nothing visually (verified: diff + Nav stay
 * styled). The admin `Nav` etc. are deliberately excluded — they rely on the
 * RSC collection and a broad strip leaves them unstyled.
 */
const DIFF_VIEW_COMPONENT_RE =
  /@payloadcms\/ui\/(?:dist|src)\/(?:icons|graphics|views\/Version|elements\/(?:HTMLDiff|FieldDiffContainer|FieldDiffLabel))\/|@payloadcms\/richtext-lexical\/(?:dist|src)\/field\/Diff\//

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
      const envName = (this as any).environment?.name as string | undefined
      const isServerEnv = options?.ssr || (envName && envName !== 'client')
      if (!isServerEnv) {
        return
      }
      // Do NOT strip in the RSC environment. Server components (e.g. the admin
      // `Nav`, a non-'use client' component that `import './index.css'`) render
      // in the RSC graph, and `@vitejs/plugin-rsc` must SEE their `.css` imports
      // there to collect them as client stylesheets. Stripping them here means
      // their CSS is never emitted and the admin renders unstyled (broken nav
      // scroll/layout, etc.). The Node-side `.css` no-op is handled by
      // `cssLoader.mjs` (dev) and by Vite's CSS extraction (build), so the
      // crash this plugin guards against does not require touching the RSC env.
      if (envName === 'rsc') {
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
      const envName = (this as any).environment?.name as string | undefined
      const isServerEnv = envName && envName !== 'client'
      if (!isServerEnv) {
        return
      }
      // In the RSC env, only strip from the version-diff component trees (see
      // `DIFF_VIEW_COMPONENT_RE`). Every other server component (the admin
      // `Nav`, etc.) must keep its `.css` import so plugin-rsc can collect it —
      // see the matching note in `resolveId` above.
      if (envName === 'rsc' && !DIFF_VIEW_COMPONENT_RE.test(id)) {
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
      // Allow a trailing query (`?v=…`, `?t=…`): Vite appends version/timestamp
      // queries to module ids, especially in the RSC graph, so a strict `$`
      // anchor would skip e.g. `icons/Check/index.js?v=83de8543`.
      if (!/\.[mc]?[jt]sx?(?:$|\?)/.test(id)) {
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
