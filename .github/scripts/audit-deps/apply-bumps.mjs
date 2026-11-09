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

export class NonRaisingBumpError extends Error {
  constructor({ dependency, version }) {
    super(
      `No ${dependency} specifier can be raised to ${version}: each already reaches it or is a range that is not exact, ^ or ~.`,
    )
    this.name = 'NonRaisingBumpError'
  }
}

/**
 * Writes each bump into its package.json files. A `catalog:` specifier is changed in the
 * pnpm-workspace.yaml catalog. Only the version text is replaced, so the file formatting
 * does not change. This function does not run pnpm.
 * A specifier that is already at or above `bump.to` is not changed, because the edit would
 * do nothing or downgrade it. A range such as `>=1.0.0` or `^1.0.0 || ^2.0.0` is not changed;
 * the re-audit shows whether the other edits fix the advisory. A bump that raises no specifier
 * throws `NonRaisingBumpError`.
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

/**
 * Returns `spec` raised to `version`, or null when `spec` is already at or above `version` or is
 * not an exact, `^` or `~` version.
 */
function raiseSpecifier({ spec, version }) {
  const match = SPECIFIER_PATTERN.exec(spec)
  if (!match) {
    return null
  }

  return compareVersions({ a: match[2], b: version }) < 0 ? `${match[1]}${version}` : null
}

function findManifestSpecifier({ dependency, text }) {
  const entryPattern = new RegExp(`("${escapeRegExp({ value: dependency })}"\\s*:\\s*")([^"]*)(")`)

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
  const name = escapeRegExp({ value: dependency })
  const keyPattern = new RegExp(
    `^(\\s+(?:${name}|'${name}'|"${name}")\\s*:\\s*)(['"]?)([^'"#\\s]*)(\\2)(.*)$`,
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

function escapeRegExp({ value }) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
