import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

/** Dist-tag used when neither --tag nor the running version implies one. */
const FALLBACK_TAG = 'canary'

/**
 * Default Payload dist-tag when the caller did not pass --tag. Every package in
 * the monorepo (this one included) is versioned and published in lockstep, so
 * the dist-tag the codemod was invoked under (`npx @payloadcms/codemod@beta`)
 * surfaces as its own version's prerelease id. Follow that train; fall back to
 * canary for stable or local dev builds that carry no prerelease id.
 */
export function resolveDefaultTag(version: string | undefined = readOwnVersion()): string {
  const id = version ? semver.prerelease(version)?.[0] : undefined
  return typeof id === 'string' ? id : FALLBACK_TAG
}

function readOwnVersion(): string | undefined {
  try {
    const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json')
    return JSON.parse(readFileSync(pkgPath, 'utf8')).version as string
  } catch {
    return undefined
  }
}
