/**
 * This was taken and modified from https://github.com/getsentry/sentry-javascript/blob/15256034ee8150a5b7dcb97d23eca1a5486f0cae/packages/nextjs/src/config/util.ts
 *
 * MIT License
 *
 * Copyright (c) 2012 Functional Software, Inc. dba Sentry
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

/**
 * @param {string | undefined} input
 * @returns {number}
 */
function _parseInt(input) {
  return parseInt(input || '', 10)
}

/**
 * Represents Semantic Versioning object
 * @typedef {Object} SemVer
 * @property {string} [buildmetadata]
 * @property {number} [canaryVersion] - undefined if not a canary version
 * @property {number} [major]
 * @property {number} [minor]
 * @property {number} [patch]
 * @property {string} [prerelease]
 */

// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const SEMVER_REGEXP =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*))*))?(?:\+([0-9a-z-]+(?:\.[0-9a-z-]+)*))?$/i

/**
 * Parses input into a SemVer interface
 * @param {string} input - string representation of a semver version
 * @returns {SemVer}
 */
export function parseSemver(input) {
  const match = input.match(SEMVER_REGEXP) || []
  const major = _parseInt(match[1])
  const minor = _parseInt(match[2])
  const patch = _parseInt(match[3])

  const prerelease = match[4]
  const canaryVersion = prerelease?.startsWith('canary.')
    ? parseInt(prerelease.split('.')[1] || '0', 10)
    : undefined

  return {
    buildmetadata: match[5],
    canaryVersion,
    major: isNaN(major) ? undefined : major,
    minor: isNaN(minor) ? undefined : minor,
    patch: isNaN(patch) ? undefined : patch,
    prerelease: match[4],
  }
}

/**
 * Returns the version of Next.js installed in the project, or undefined if it cannot be determined.
 * @returns {SemVer | undefined}
 */
export function getNextjsVersion() {
  try {
    /** @type {string} */
    let pkgPath

    // Check if we're in ESM or CJS environment
    if (typeof import.meta?.resolve === 'function') {
      // ESM environment - use import.meta.resolve
      const pkgUrl = import.meta.resolve('next/package.json')
      // Use fileURLToPath for proper cross-platform path handling (Windows, macOS, Linux)
      // new URL().pathname returns '/C:/path' on Windows which causes path resolution issues
      pkgPath = fileURLToPath(pkgUrl)
    } else {
      // CJS environment - use require.resolve
      pkgPath = require.resolve('next/package.json')
    }

    const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'))
    return parseSemver(pkgJson.version)
  } catch (e) {
    console.error('Payload: Error getting Next.js version', e)
    return undefined
  }
}

/**
 * Reads the `next` peer dependency range declared by `@payloadcms/next` itself,
 * so the supported range stays in sync with `package.json` rather than being
 * duplicated. Returns undefined if it cannot be read.
 * @returns {string | undefined}
 */
export function getSupportedNextRange() {
  try {
    /** @type {string} */
    let pkgPath

    if (typeof import.meta?.url === 'string') {
      // ESM environment - resolve relative to this module. Both the source
      // (src/withPayload/) and published (dist/withPayload/ and dist/cjs/)
      // locations are two levels below the package root.
      pkgPath = fileURLToPath(new URL('../../package.json', import.meta.url))
    } else if (typeof __dirname !== 'undefined') {
      // CJS environment
      pkgPath = join(__dirname, '../../package.json')
    } else {
      return undefined
    }

    const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'))
    return pkgJson?.peerDependencies?.next
  } catch {
    return undefined
  }
}

/**
 * Compares the core (major.minor.patch) of two SemVer objects, ignoring
 * prerelease and build metadata.
 * @param {SemVer} a
 * @param {SemVer} b
 * @returns {number} negative if a < b, 0 if equal, positive if a > b
 */
function compareCoreVersion(a, b) {
  return (
    (a.major ?? 0) - (b.major ?? 0) ||
    (a.minor ?? 0) - (b.minor ?? 0) ||
    (a.patch ?? 0) - (b.patch ?? 0)
  )
}

/**
 * Minimal semver range check supporting the comparator syntax Payload uses in
 * its `next` peer dependency, e.g. `>=16.2.6 <17.0.0` and disjoint ranges joined
 * by `||`. We avoid a runtime `semver` dependency because this file runs inside
 * `next.config` before the build, where extra dependencies are undesirable.
 * @param {SemVer} version
 * @param {string} range
 * @returns {boolean}
 */
export function satisfiesNextRange(version, range) {
  if (version?.major === undefined || !range) {
    return false
  }

  return range.split('||').some((clause) => {
    const comparators = clause.trim().split(/\s+/).filter(Boolean)

    if (comparators.length === 0) {
      return false
    }

    return comparators.every((comparator) => {
      const match = comparator.match(/^(>=|<=|>|<|=)?\s*(.+)$/)

      if (!match) {
        return false
      }

      const operator = match[1] || '='
      const bound = parseSemver(match[2])

      if (bound.major === undefined) {
        return false
      }

      const comparison = compareCoreVersion(version, bound)

      switch (operator) {
        case '<':
          return comparison < 0
        case '<=':
          return comparison <= 0
        case '>':
          return comparison > 0
        case '>=':
          return comparison >= 0
        default:
          return comparison === 0
      }
    })
  })
}

/**
 * Pure builder for the unsupported-version warning. Returns a clear, actionable
 * message when `installedVersion` falls outside `supportedRange`, or undefined
 * when the version is supported or either input is missing (so the build is
 * never blocked by the check itself). Inputs are explicit so this stays pure and
 * easy to test; callers resolve them via `getNextjsVersion` / `getSupportedNextRange`.
 * @param {SemVer | undefined} installedVersion
 * @param {string | undefined} supportedRange
 * @returns {string | undefined}
 */
export function getUnsupportedNextVersionWarning(installedVersion, supportedRange) {
  if (
    !installedVersion ||
    installedVersion.major === undefined ||
    !supportedRange ||
    satisfiesNextRange(installedVersion, supportedRange)
  ) {
    return undefined
  }

  const installedString = `${installedVersion.major}.${installedVersion.minor}.${installedVersion.patch}`

  return `Payload: the installed Next.js version (${installedString}) is outside the supported range "${supportedRange}". Unsupported versions may break the Admin Panel or contain unpatched security advisories. Install a supported Next.js version to clear this warning.`
}
