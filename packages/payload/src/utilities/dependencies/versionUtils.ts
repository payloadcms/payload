// @ts-strict-ignore
import type { CustomVersionParser } from './dependencyChecker.js'

export function parseVersion(version: string): { parts: number[]; preReleases: string[] } {
  const [mainVersion, ...preReleases] = version.split('-')
  const parts = mainVersion.split('.').map(Number)
  return { parts, preReleases }
}

function extractNumbers(str: string): number[] {
  const matches = str.match(/\d+/g) || []
  return matches.map(Number)
}

function comparePreRelease(v1: string, v2: string): number {
  const num1 = extractNumbers(v1)
  const num2 = extractNumbers(v2)

  for (let i = 0; i < Math.max(num1.length, num2.length); i++) {
    if ((num1[i] || 0) < (num2[i] || 0)) {
      return -1
    }
    if ((num1[i] || 0) > (num2[i] || 0)) {
      return 1
    }
  }

  // If numeric parts are equal, compare the whole string
  if (v1 < v2) {
    return -1
  }
  if (v1 > v2) {
    return 1
  }
  return 0
}

/**
 * Compares two semantic version strings, including handling pre-release identifiers.
 *
 * This function first compares the major, minor, and patch components as integers.
 * If these components are equal, it then moves on to compare pre-release versions.
 * Pre-release versions are compared first by extracting and comparing any numerical values.
 * If numerical values are equal, it compares the whole pre-release string lexicographically.
 *
 * @param {string} compare - The first version string to compare.
 * @param {string} to - The second version string to compare.
 * @param {function} [customVersionParser] - An optional function to parse version strings into parts and pre-releases.
 * @returns {string} - Returns greater if compare is greater than to, lower if compare is less than to, and equal if they are equal.
 */
export function compareVersions(
  compare: string,
  to: string,
  customVersionParser?: CustomVersionParser,
): 'equal' | 'greater' | 'lower' {
  const { parts: parts1, preReleases: preReleases1 } = customVersionParser
    ? customVersionParser(compare)
    : parseVersion(compare)
  const { parts: parts2, preReleases: preReleases2 } = customVersionParser
    ? customVersionParser(to)
    : parseVersion(to)

  // Compare main version parts
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    if ((parts1[i] || 0) > (parts2[i] || 0)) {
      return 'greater'
    }
    if ((parts1[i] || 0) < (parts2[i] || 0)) {
      return 'lower'
    }
  }

  // Compare pre-release parts if main versions are equal
  if (preReleases1?.length || preReleases2?.length) {
    for (let i = 0; i < Math.max(preReleases1.length, preReleases2.length); i++) {
      if (!preReleases1[i]) {
        return 'greater'
      }
      if (!preReleases2[i]) {
        return 'lower'
      }

      const result = comparePreRelease(preReleases1[i], preReleases2[i])
      if (result !== 0) {
        return result === 1 ? 'greater' : 'lower'
      }
      // Equal => continue for loop to check for next pre-release part
    }
  }

  return 'equal'
}
