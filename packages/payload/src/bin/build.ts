/* eslint-disable no-console */
import { spawn } from 'node:child_process'
import fs, { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import type { SanitizedConfig } from '../config/types.js'

import { NEXT_PAYLOAD_ROUTE_GROUP, TANSTACK_PAYLOAD_DIR } from './frameworkConventions.js'
import { generateImportMap } from './generateImportMap/index.js'
import { generateTypes } from './generateTypes.js'

type Framework = 'next' | 'tanstack-start'

const NEXT_CONFIG_FILES = ['next.config.js', 'next.config.ts', 'next.config.mjs', 'next.config.cjs']
const VITE_CONFIG_FILES = [
  'vite.config.js',
  'vite.config.ts',
  'vite.config.mjs',
  'vite.config.cjs',
  'vite.config.cts',
  'vite.config.mts',
]

/**
 * `payload build` — generate the import map (and types) so they are on disk
 * before `next build` statically imports them, then run the project's Next.js
 * build, forwarding any extra CLI args verbatim.
 *
 * Owns its own process lifecycle: it exits with `next build`'s exit code, or
 * exits 1 if pre-build generation fails (never builds against a stale map).
 */
export async function build({ config }: { config: SanitizedConfig }): Promise<void> {
  const skipTypes = process.argv.includes('--no-types')

  try {
    await generateImportMap(config, { log: true })
    if (!skipTypes) {
      await generateTypes(config, { log: true })
    }
  } catch (err) {
    console.error('Pre-build generation failed:')
    console.error(err)
    return process.exit(1)
  }

  const nextBin = resolveNextBin()
  const forwardedArgs = getForwardedArgs()

  const exitCode = await new Promise<number>((resolve) => {
    const child = spawn(process.execPath, [nextBin, 'build', ...forwardedArgs], {
      stdio: 'inherit',
    })
    child.on('error', (err) => {
      console.error('Failed to run next build:')
      console.error(err)
      resolve(1)
    })
    child.on('exit', (code) => {
      resolve(code ?? 0)
    })
  })

  process.exit(exitCode)
}

/**
 * Determine whether the project builds with Next.js or TanStack Start. An explicit
 * `PAYLOAD_FRAMEWORK` env wins; otherwise tries the most intentional signals first
 * — declared dependencies, then framework config files, then Payload's
 * admin-route folder conventions — falling through when a layer is inconclusive.
 * Throws with guidance for an unsupported override or when no single framework can
 * be determined.
 */
export function detectFramework(cwd: string = process.cwd()): Framework {
  const override = process.env.PAYLOAD_FRAMEWORK
  if (override) {
    if (isFramework(override)) {
      return override
    }
    throw new Error(
      `PAYLOAD_FRAMEWORK is set to "${override}", which is not supported. Use one of: next, tanstack-start.`,
    )
  }

  const deps = readProjectDependencies(cwd)
  const hasNextDep = Boolean(deps.next)
  const hasTanstackDep = Boolean(deps['@tanstack/react-start'])
  if (hasNextDep && !hasTanstackDep) {
    return 'next'
  }
  if (hasTanstackDep && !hasNextDep) {
    return 'tanstack-start'
  }

  const hasNextConfig = NEXT_CONFIG_FILES.some((file) => fs.existsSync(path.join(cwd, file)))
  const hasViteConfig = VITE_CONFIG_FILES.some((file) => fs.existsSync(path.join(cwd, file)))
  if (hasNextConfig && !hasViteConfig) {
    return 'next'
  }
  if (hasViteConfig && !hasNextConfig) {
    return 'tanstack-start'
  }

  const hasNextFolder = [
    path.join(cwd, 'app', NEXT_PAYLOAD_ROUTE_GROUP),
    path.join(cwd, 'src', 'app', NEXT_PAYLOAD_ROUTE_GROUP),
  ].some((dir) => fs.existsSync(dir))
  const hasTanstackFolder = [
    path.join(cwd, 'app', TANSTACK_PAYLOAD_DIR),
    path.join(cwd, 'src', 'app', TANSTACK_PAYLOAD_DIR),
  ].some((dir) => fs.existsSync(dir))
  if (hasNextFolder && !hasTanstackFolder) {
    return 'next'
  }
  if (hasTanstackFolder && !hasNextFolder) {
    return 'tanstack-start'
  }

  throw new Error(
    buildDetectionError({
      hasNextConfig,
      hasNextDep,
      hasNextFolder,
      hasTanstackDep,
      hasTanstackFolder,
      hasViteConfig,
    }),
  )
}

/**
 * Resolve the project's `next` binary from its own manifest, robust to a future
 * `exports` field and to internal layout changes. Resolving from `cwd` (not
 * PATH) works whether `payload build` runs via an npm script or `npx`.
 */
export function resolveNextBin(cwd: string = process.cwd()): string {
  return resolveBin({ cwd, packageName: 'next' })
}

/**
 * Resolve the project's `vite` binary from its own manifest, mirroring
 * `resolveNextBin`. Resolving from `cwd` (not PATH) works whether `payload build`
 * runs via an npm script or `npx`.
 */
export function resolveViteBin(cwd: string = process.cwd()): string {
  return resolveBin({ cwd, packageName: 'vite' })
}

/**
 * Map a detected framework to the resolved binary and argument list to spawn.
 * Both frameworks take the `build` subcommand followed by the forwarded args.
 */
export function resolveBuildCommand({
  cwd = process.cwd(),
  forwardedArgs,
  framework,
}: {
  cwd?: string
  forwardedArgs: string[]
  framework: Framework
}): { args: string[]; bin: string } {
  const bin = framework === 'next' ? resolveNextBin(cwd) : resolveViteBin(cwd)
  return { args: ['build', ...forwardedArgs], bin }
}

/**
 * Forward the raw args that follow the `build` subcommand to `next build`,
 * dropping payload-only flags. Uses raw argv (not minimist) so flags like
 * `--turbopack` or `--experimental-build-mode` pass through verbatim.
 */
export function getForwardedArgs(argv: string[] = process.argv.slice(2)): string[] {
  const buildIndex = argv.indexOf('build')
  const rest = buildIndex === -1 ? argv : argv.slice(buildIndex + 1)
  return rest.filter((arg) => arg !== '--no-types')
}

function isFramework(value: string): value is Framework {
  return value === 'next' || value === 'tanstack-start'
}

function readProjectDependencies(cwd: string): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    return { ...pkg.dependencies, ...pkg.devDependencies }
  } catch {
    return {}
  }
}

function buildDetectionError(signals: {
  hasNextConfig: boolean
  hasNextDep: boolean
  hasNextFolder: boolean
  hasTanstackDep: boolean
  hasTanstackFolder: boolean
  hasViteConfig: boolean
}): string {
  const conflicts: string[] = []
  if (signals.hasNextDep && signals.hasTanstackDep) {
    conflicts.push('dependencies (`next` and `@tanstack/react-start`)')
  }
  if (signals.hasNextConfig && signals.hasViteConfig) {
    conflicts.push('config files (next.config.* and vite.config.*)')
  }
  if (signals.hasNextFolder && signals.hasTanstackFolder) {
    conflicts.push('app folders (app/(payload) and app/_payload)')
  }

  if (conflicts.length) {
    return `Could not determine your framework for \`payload build\`: conflicting signals found in ${conflicts.join(', ')}. Resolve the conflict so only one framework is indicated.`
  }

  return [
    'Could not determine your framework for `payload build`.',
    'Checked:',
    '  • dependencies: no `next` or `@tanstack/react-start` in package.json',
    '  • config files: no next.config.* or vite.config.*',
    '  • app folders:  no app/(payload) or app/_payload',
    'Install your framework (Next.js or TanStack Start) and try again.',
  ].join('\n')
}

/**
 * Resolve a framework's binary path from its own package manifest, robust to a
 * future `exports` field and to internal layout changes. Resolving from `cwd`
 * (not PATH) works whether `payload build` runs via an npm script or `npx`.
 */
function resolveBin({ cwd, packageName }: { cwd: string; packageName: string }): string {
  const require = createRequire(path.join(cwd, 'package.json'))

  let pkgPath: string
  try {
    pkgPath = require.resolve(`${packageName}/package.json`)
  } catch {
    throw new Error(
      `Could not resolve "${packageName}" from the current project. Is ${packageName} installed?`,
    )
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    bin?: Record<string, string> | string
  }
  const binField = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.[packageName]
  if (!binField) {
    throw new Error(
      `Could not determine the "${packageName}" binary path from ${packageName}/package.json.`,
    )
  }

  return path.join(path.dirname(pkgPath), binField)
}
