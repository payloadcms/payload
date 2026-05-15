import type { PluginOption } from 'vite'

/**
 * Stops Vite from trying to load SCSS/CSS/LESS during SSR when the importer
 * lives inside a built `dist/` directory or when the specifier is a bare
 * package name. Returning an empty virtual module lets the server bundle
 * succeed without producing any stylesheet output.
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
      const isStyleFile = /\.(?:s?css|less)$/.test(id)
      if (!isStyleFile) {
        return
      }
      if (importer && /\/dist\//.test(importer)) {
        return '\0ssr-empty-style'
      }
      if (/^@?[a-z]/.test(id) && !id.startsWith('.') && !id.startsWith('/')) {
        return '\0ssr-empty-style'
      }
    },
  }
}
