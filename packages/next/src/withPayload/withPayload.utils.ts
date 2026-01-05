/* eslint-disable no-console */
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
import { fileURLToPath } from 'url'

function _parseInt(input: string | undefined): number {
  return parseInt(input || '', 10)
}

/**
 * Represents Semantic Versioning object
 */
type SemVer = {
  buildmetadata?: string
  /**
   * undefined if not a canary version
   */
  canaryVersion?: number
  major?: number
  minor?: number
  patch?: number
  prerelease?: string
}

// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const SEMVER_REGEXP =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*))*))?(?:\+([0-9a-z-]+(?:\.[0-9a-z-]+)*))?$/i

/**
 * Parses input into a SemVer interface
 * @param input string representation of a semver version
 */
export function parseSemver(input: string): SemVer {
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
 */
export function getNextjsVersion(): SemVer | undefined {
  try {
    let pkgPath: string

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
 * Checks if the current Next.js version supports Turbopack externalize transitive dependencies.
 * This was introduced in Next.js v16.1.0-canary.3
 */
export function supportsTurbopackExternalizeTransitiveDependencies(
  version: SemVer | undefined,
): boolean {
  if (!version) {
    return false
  }

  const { canaryVersion, major, minor, patch } = version

  if (major === undefined || minor === undefined) {
    return false
  }

  if (major > 16) {
    return true
  }

  if (major === 16) {
    if (minor > 1) {
      return true
    }
    if (minor === 1) {
      // 16.1.1+ and canaries support this feature
      if (patch > 0) {
        return true
      }
      if (canaryVersion !== undefined) {
        // 16.1.0-canary.3+
        return canaryVersion >= 3
      } else {
        // Next.js 16.1.0
        return true
      }
    }
  }

  return false
}
