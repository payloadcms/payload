/* eslint-disable no-console */
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import type { SanitizedConfig } from '../config/types.js'

import { generateImportMap } from './generateImportMap/index.js'
import { generateTypes } from './generateTypes.js'

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
    process.exit(1)
    return
  }

  const nextBin = resolveNextBin()
  const forwardedArgs = getForwardedArgs()

  const child = spawn(process.execPath, [nextBin, 'build', ...forwardedArgs], {
    stdio: 'inherit',
  })

  child.on('exit', (code) => {
    process.exit(code ?? 0)
  })
}

/**
 * Resolve the project's `next` binary from its own manifest, robust to a future
 * `exports` field and to internal layout changes. Resolving from `cwd` (not
 * PATH) works whether `payload build` runs via an npm script or `npx`.
 */
export function resolveNextBin(cwd: string = process.cwd()): string {
  const require = createRequire(path.join(cwd, 'package.json'))

  let nextPkgPath: string
  try {
    nextPkgPath = require.resolve('next/package.json')
  } catch {
    throw new Error('Could not resolve "next" from the current project. Is Next.js installed?')
  }

  const nextPkg = JSON.parse(readFileSync(nextPkgPath, 'utf8')) as {
    bin?: Record<string, string> | string
  }
  const binField = typeof nextPkg.bin === 'string' ? nextPkg.bin : nextPkg.bin?.next
  if (!binField) {
    throw new Error('Could not determine the "next" binary path from next/package.json.')
  }

  return path.join(path.dirname(nextPkgPath), binField)
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
