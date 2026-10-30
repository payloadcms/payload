import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { compareVersions } from './bumps.mjs'

/**
 * @typedef {object} AppliedChange
 * @property {string} file repo-relative path of the edited file
 * @property {string} dependency
 * @property {string} before specifier before the edit
 * @property {string} after specifier after the edit
 */

const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]
const WORKSPACE_FILE = 'pnpm-workspace.yaml'
const SPECIFIER_PATTERN = /^([\^~]?)(\d+\.\d+\.\d+)$/

export class UnsupportedSpecifierError extends Error {
  constructor({ spec }) {
    super(`Unsupported dependency specifier "${spec}"; only exact, ^ and ~ ranges can be bumped.`)
    this.name = 'UnsupportedSpecifierError'
  }
}

export class NonRaisingBumpError extends Error {
  constructor({ dependency, version }) {
    super(`Every ${dependency} specifier already reaches ${version}; the bump raises none.`)
    this.name = 'NonRaisingBumpError'
  }
}

/** Keeps the range prefix of `spec` and swaps in `version`. */
export function setSpecifierVersion({ spec, version }) {
  const match = SPECIFIER_PATTERN.exec(spec)
  if (!match) {
    throw new UnsupportedSpecifierError({ spec })
  }
  return `${match[1]}${version}`
}

/**
 * Edits manifests, or the pnpm catalog entry for `catalog:` specifiers, with targeted
 * text replacement so formatting survives. Does not run pnpm. A spec already at or above
 * `bump.to` is left alone, since editing it would be a no-op or a downgrade; a bump that
 * raises no spec throws `NonRaisingBumpError`.
 * @param {{ bumps: Array<import('./bumps.mjs').Bump>, cwd: string }} params
 * @returns {Promise<{ changes: AppliedChange[] }>}
 */
export async function applyBumps({ bumps, cwd }) {
  /** @type {AppliedChange[]} */
  const changes = []

  for (const bump of bumps) {
    const bumpChanges = []
    let isCatalogSeen = false

    for (const manifest of bump.manifests) {
      const manifestPath = path.join(cwd, manifest)
      const text = await readFile(manifestPath, 'utf8')
      const found = findManifestSpecifier({ dependency: bump.dependency, text })
      if (!found) {
        throw new Error(`${manifest} does not declare ${bump.dependency}`)
      }

      if (found.spec === 'catalog:') {
        if (isCatalogSeen) {
          continue
        }
        isCatalogSeen = true
        const change = await editCatalogEntry({
          cwd,
          dependency: bump.dependency,
          version: bump.to,
        })
        if (change) {
          bumpChanges.push(change)
        }
        continue
      }

      const after = raiseSpecifier({ spec: found.spec, version: bump.to })
      if (after === null) {
        continue
      }
      const edited = text.slice(0, found.start) + after + text.slice(found.end)
      await writeFile(manifestPath, edited)
      bumpChanges.push({ file: manifest, after, before: found.spec, dependency: bump.dependency })
    }

    if (bumpChanges.length === 0) {
      throw new NonRaisingBumpError({ dependency: bump.dependency, version: bump.to })
    }
    changes.push(...bumpChanges)
  }

  return { changes }
}

/** The raised spec, or null when `spec` already reaches `version`. */
function raiseSpecifier({ spec, version }) {
  const after = setSpecifierVersion({ spec, version })
  const [, , current] = SPECIFIER_PATTERN.exec(spec)

  return compareVersions({ a: current, b: version }) < 0 ? after : null
}

function findManifestSpecifier({ dependency, text }) {
  const entryPattern = new RegExp(`("${escapeRegExp(dependency)}"\\s*:\\s*")([^"]*)(")`)

  for (const section of DEPENDENCY_SECTIONS) {
    const sectionPattern = new RegExp(`"${section}"\\s*:\\s*\\{[^}]*\\}`, 'g')
    for (const sectionMatch of text.matchAll(sectionPattern)) {
      const entryMatch = entryPattern.exec(sectionMatch[0])
      if (!entryMatch) {
        continue
      }
      const start = sectionMatch.index + entryMatch.index + entryMatch[1].length
      return { end: start + entryMatch[2].length, spec: entryMatch[2], start }
    }
  }
  return null
}

async function editCatalogEntry({ cwd, dependency, version }) {
  const workspacePath = path.join(cwd, WORKSPACE_FILE)
  const lines = (await readFile(workspacePath, 'utf8')).split('\n')
  const keyPattern = new RegExp(
    `^(\\s+(?:${escapeRegExp(dependency)}|'${escapeRegExp(dependency)}'|"${escapeRegExp(dependency)}")\\s*:\\s*)(['"]?)([^'"#\\s]*)(\\2)(.*)$`,
  )

  const catalogIndex = lines.findIndex((line) => /^catalog:\s*(#.*)?$/.test(line))
  if (catalogIndex === -1) {
    throw new Error(`${WORKSPACE_FILE} has no catalog block`)
  }

  for (let index = catalogIndex + 1; index < lines.length; index++) {
    const line = lines[index]
    if (/^\S/.test(line)) {
      break
    }
    const match = keyPattern.exec(line)
    if (!match) {
      continue
    }
    const before = match[3]
    const after = raiseSpecifier({ spec: before, version })
    if (after === null) {
      return null
    }
    lines[index] = `${match[1]}${match[2]}${after}${match[4]}${match[5]}`
    await writeFile(workspacePath, lines.join('\n'))
    return { file: WORKSPACE_FILE, after, before, dependency }
  }

  throw new Error(`${WORKSPACE_FILE} catalog does not declare ${dependency}`)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
