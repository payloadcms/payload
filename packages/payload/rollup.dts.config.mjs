import dts from 'rollup-plugin-dts'
import path from 'node:path'

import { builtinModules } from 'node:module'

const WHITELIST = ['ts-essentials', 'croner', '@payloadcms/translations'] // <-- only these get bundled

/**
 * One-step DTS bundle:
 * - Input from your TS source entry
 * - Output to a single dist/index.bundled.d.ts
 * - respectExternal: true -> aggressively inline third-party .d.ts (helps with ts-essentials)
 */
export default [
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.bundled.d.ts', format: 'es' },
    plugins: [
      dts({
        tsconfig: './tsconfig.bundletypes.json',
        respectExternal: true,
        compilerOptions: {},
      }),
    ],

    /**
     * Externalize all non-whitelisted packages and Node builtins.
     * If we bundle all packages, this script runs out of memory.
     */
    external: (id) => {
      // 1) Always keep Node builtins external
      if (builtinModules.includes(id) || builtinModules.includes(id.replace(/^node:/, '')))
        return true

      // 2) Keep virtual/internal rollup ids external just in case
      if (id.startsWith('\0')) return true

      // 3) Never externalize *local* files (we want our own .d.ts bundled)
      if (id.startsWith('.') || path.isAbsolute(id)) return false

      // 4) Bundle only whitelisted packages (opt-in)
      const isWhitelisted = WHITELIST.some((p) => id === p || id.startsWith(`${p}/`))
      return !isWhitelisted // everything else is external
    },
  },
]
