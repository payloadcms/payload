import type { PluginOption } from 'vite'

/**
 * Wraps CJS `node_modules` files in ESM-compatible code when served to the
 * client.
 *
 * Packages in `optimizeDeps.exclude` (like `payload`, `@payloadcms/ui`) import
 * CJS dependencies that Vite serves via raw `/@fs/` URLs, bypassing
 * pre-bundling. The browser fails to parse them because they use
 * `module.exports` / `exports.X` syntax.
 *
 * This plugin detects CJS patterns in the transform phase and wraps them with
 * a CommonJS-like runtime shim so the browser can execute them as ESM.
 */
export function wrapCjsForClient(): PluginOption {
  return {
    name: 'payload:wrap-cjs-client',
    apply: 'serve',
    enforce: 'post',
    transform(code, id, options) {
      if (options?.ssr) {
        return
      }

      if (!id.includes('/node_modules/') || id.includes('/node_modules/.vite/')) {
        return
      }

      const cleanId = id.replace(/\?.*$/, '')
      if (!cleanId.endsWith('.js') && !cleanId.endsWith('.cjs')) {
        return
      }

      if (code.includes('import ') || code.includes('export ')) {
        return
      }

      if (
        !code.includes('module.exports') &&
        !code.includes('exports.') &&
        !code.includes('Object.defineProperty(exports')
      ) {
        return
      }

      const namedExports = extractCjsExports(code)
      const names = Object.keys(namedExports)

      const declaredIdentifiers = extractDeclaredIdentifiers(code)
      const safeNames = names.filter((name) => !declaredIdentifiers.has(name))

      // If the module already declares its own top-level `require` (rare but
      // possible for hand-written CJS), skip injecting our stub so we don't
      // produce a `SyntaxError: Identifier 'require' has already been declared`.
      const injectRequireStub = !declaredIdentifiers.has('require')

      const wrapped = [
        `var module = { exports: {} };`,
        `var exports = module.exports;`,
        // Expose a `require` stub so UMD wrappers that gate their CJS branch on
        // `typeof require === 'function'` (e.g. pluralize) take that branch and
        // assign to our `module.exports` instead of falling through to the
        // browser-globals branch (`root.foo = ...`), which throws in strict ESM
        // because the IIFE receives `this === undefined`.
        // The stub throws on actual invocation so any module that *really* needs
        // require fails loudly instead of silently misbehaving.
        injectRequireStub
          ? `var require = function require() { throw new Error("require() is not available in the browser bundle"); };`
          : ``,
        ``,
        code,
        ``,
        `var __cjs_result__ = module.exports;`,
        `export default __cjs_result__;`,
        ...safeNames.map(
          (name) =>
            `export var ${name} = typeof __cjs_result__ === 'object' && __cjs_result__ !== null ? __cjs_result__["${name}"] : undefined;`,
        ),
      ].join('\n')

      return { code: wrapped, map: null }
    },
  }
}

function extractCjsExports(code: string): Record<string, true> {
  const found: Record<string, true> = {}
  const patterns = [
    /exports\.(\w+)\s*=/g,
    /exports\[["'](\w+)["']\]\s*=/g,
    /Object\.defineProperty\(exports,\s*["'](\w+)["']/g,
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(code)) !== null) {
      const name = m[1]!
      if (name !== '__esModule' && name !== 'default') {
        found[name] = true
      }
    }
  }
  return found
}

/**
 * Detects top-level identifiers declared with class/function/var/let/const in
 * CJS code. Used to avoid re-declaring them via `export var` in the CJS
 * wrapper, which would cause `SyntaxError: Identifier has already been
 * declared` in strict mode (ESM).
 */
function extractDeclaredIdentifiers(code: string): Set<string> {
  const identifiers = new Set<string>()
  const patterns = [/\bclass\s+(\w+)/g, /\bfunction\s+(\w+)/g, /\b(?:var|let|const)\s+(\w+)/g]
  for (const re of patterns) {
    let m
    while ((m = re.exec(code)) !== null) {
      identifiers.add(m[1]!)
    }
  }
  return identifiers
}
