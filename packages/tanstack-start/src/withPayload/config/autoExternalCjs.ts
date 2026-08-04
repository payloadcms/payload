import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

/** Framework-owned packages, which must keep resolving through Vite. */
const neverExternal = [
  'react',
  'react-dom',
  'scheduler',
  'vite',
  'nitro',
  '@payloadcms/',
  '@tanstack/',
  '@vitejs/',
  'react-server-dom-webpack',
]

/**
 * Returns the app's CommonJS-only dependencies, for `ssr.external` during dev serve.
 *
 * The server environments resolve with `noExternal: true` and
 * `optimizeDeps.noDiscovery: true`, so every CJS dependency reaches
 * `@vitejs/plugin-rsc`'s CJS-to-ESM rewrite, which breaks on circular `require`s
 * (`xmlbuilder` via `xml2js`, `whatwg-url` via `jsdom`) and 500s the route.
 * Letting Node load them restores Vite's default dev-SSR behavior. Their own
 * dependencies go through Node too, so only direct ones need discovering.
 */
export function resolveCjsDependencies({
  exclude,
  root,
}: {
  /** Package names already handled by other config (curated externals, optimizer). */
  exclude: string[]
  /** App root containing the `package.json` to read dependencies from. */
  root: string
}): string[] {
  const packageJsonPath = path.join(root, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  let dependencies: string[]

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

    dependencies = [
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ]
  } catch {
    return []
  }

  const require = createRequire(packageJsonPath)

  return dependencies.filter(
    (name) =>
      !exclude.includes(name) &&
      !neverExternal.some((prefix) => name === prefix || name.startsWith(prefix)) &&
      isCommonJSOnly({ name, require }),
  )
}

/**
 * True when `require` resolves the package and it publishes no ESM entry. Dual
 * packages resolve to their ESM entry, which never reaches the CJS transform.
 */
const isCommonJSOnly = ({ name, require }: { name: string; require: NodeJS.Require }): boolean => {
  let entry: string

  try {
    entry = require.resolve(name)
  } catch {
    return false
  }

  if (entry.endsWith('.mjs') || !entry.includes('node_modules')) {
    return false
  }

  const packageJson = readPackageJson(entry)

  if (
    !packageJson ||
    packageJson.type === 'module' ||
    packageJson.module ||
    hasImportCondition(packageJson.exports)
  ) {
    return false
  }

  // Client components must keep flowing through the RSC plugin.
  return !hasUseClientDirective(entry)
}

type PackageJson = {
  exports?: unknown
  module?: string
  type?: string
}

const readPackageJson = (entry: string): PackageJson | undefined => {
  let directory = path.dirname(entry)

  while (directory.includes('node_modules')) {
    const candidate = path.join(directory, 'package.json')

    if (fs.existsSync(candidate)) {
      try {
        return JSON.parse(fs.readFileSync(candidate, 'utf-8'))
      } catch {
        return undefined
      }
    }

    const parent = path.dirname(directory)

    if (parent === directory) {
      return undefined
    }

    directory = parent
  }

  return undefined
}

const hasImportCondition = (exports: unknown): boolean => {
  if (!exports || typeof exports !== 'object') {
    return false
  }

  return Object.entries(exports).some(
    ([key, value]) => key === 'import' || key === 'module' || hasImportCondition(value),
  )
}

const hasUseClientDirective = (entry: string): boolean => {
  try {
    return /^\s*(['"])use client\1/.test(fs.readFileSync(entry, 'utf-8').slice(0, 512))
  } catch {
    return false
  }
}
