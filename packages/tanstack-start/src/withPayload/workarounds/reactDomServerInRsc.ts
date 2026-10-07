import type { PluginOption } from 'vite'

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const REACT_DOM_SERVER_RE = /^react-dom\/server(?:\.(?:edge|node|browser))?$/

/**
 * Provides a working `react-dom/server` inside the RSC environment.
 *
 * Payload's version-diff converters (`@payloadcms/richtext-lexical`'s
 * `field/Diff/converters/*` and `@payloadcms/ui`'s `Version/RenderFieldsToDiff`)
 * call `renderToStaticMarkup` while rendering a Server Component. In the RSC
 * environment Vite activates the `react-server` export condition, under which
 * every `react-dom/server*` subpath resolves to `server.react-server.js` — a
 * stub that throws `react-dom/server is not supported in React Server
 * Components`. Force-resolving past the condition isn't enough either: the
 * static renderer reads the *client* React internals
 * (`__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`), which
 * the `react-server` build of `react` doesn't expose.
 *
 * So we pre-bundle a self-contained `react-dom/server` with client React
 * inlined (esbuild, deliberately WITHOUT the `react-server` condition) and
 * redirect `react-dom/server` to it in the RSC graph only. The bundle is fully
 * self-contained, so the RSC environment's `react-server` condition can't
 * reach into it. JSX elements created by the RSC-graph React stay renderable
 * because React identifies elements via a process-global `Symbol.for(...)`.
 *
 * Delete this once `react-dom/server` (or an equivalent static renderer) is
 * usable from the `react-server` condition without a separate bundle.
 */
export function reactDomServerInRsc(): PluginOption {
  const RESOLVED_ID = '\0payload:react-dom-server-rsc'
  let bundledCode: string | undefined

  const buildBundle = (): string => {
    if (bundledCode !== undefined) {
      return bundledCode
    }
    // esbuild is always present as a Vite dependency. Typed loosely because it
    // isn't a direct dependency of this package.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const esbuild: any = require('esbuild')
    const result = esbuild.buildSync({
      banner: {
        // The bundled CJS React DOM server build does `require('util')` etc.
        // esbuild's ESM output otherwise emits a stub that throws "Dynamic
        // require of ... is not supported" inside Vite's module runner, so wire
        // up a real `require` for Node built-ins.
        js: "import { createRequire as __pl_cr } from 'node:module';const require = __pl_cr(import.meta.url);",
      },
      bundle: true,
      // Resolve react/react-dom to their CLIENT builds — NOT the `react-server`
      // condition the RSC environment would otherwise apply.
      conditions: ['node', 'import', 'default'],
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      format: 'esm',
      platform: 'node',
      stdin: {
        contents: [
          "import * as ReactDOMServer from 'react-dom/server'",
          "export * from 'react-dom/server'",
          'export default ReactDOMServer',
        ].join('\n'),
        loader: 'js',
        resolveDir: process.cwd(),
      },
      write: false,
    })
    const code = result.outputFiles[0].text as string
    bundledCode = code
    return code
  }

  return {
    name: 'payload:react-dom-server-in-rsc',
    enforce: 'pre',
    load(id) {
      if (id === RESOLVED_ID) {
        return buildBundle()
      }
    },
    resolveId(id) {
      if ((this as any).environment?.name === 'rsc' && REACT_DOM_SERVER_RE.test(id)) {
        return RESOLVED_ID
      }
    },
  }
}
