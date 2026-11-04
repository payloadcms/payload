import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * @typedef {object} WorkspacePackage
 * @property {string} name
 * @property {boolean} isPrivate
 * @property {string[]} dependencies names in `dependencies` only
 *
 * @typedef {{ name: string, dir: string }} PackageRef
 */

/**
 * Reads each `packages/*\/package.json` under `cwd` into a map keyed by folder name. Private
 * packages are included, with `isPrivate` set.
 * @returns {Promise<Map<string, WorkspacePackage>>}
 */
export async function listPublishedPackages({ cwd }) {
  const packagesDir = path.join(cwd, 'packages')
  const dirents = await readdir(packagesDir, { withFileTypes: true })
  const graph = new Map()

  for (const dirent of dirents.filter((entry) => entry.isDirectory())) {
    const manifest = await readManifest({
      file: path.join(packagesDir, dirent.name, 'package.json'),
    })
    if (!manifest || typeof manifest.name !== 'string') {
      continue
    }

    graph.set(dirent.name, {
      name: manifest.name,
      isPrivate: manifest.private === true,
      dependencies: Object.keys(manifest.dependencies ?? {}),
    })
  }

  return graph
}

/**
 * Finds the published packages that a bump affects. `direct` holds the published packages in
 * `originDirs`. `via` holds the other published packages that depend on a `direct` package
 * through `dependencies`, at any depth. Private packages are not listed, and the search does not
 * pass through them.
 * @returns {{ direct: PackageRef[], via: PackageRef[] }}
 */
export function resolveAffects({ graph, originDirs }) {
  const isPublished = (dir) => graph.has(dir) && !graph.get(dir).isPrivate

  const directDirs = [...new Set(originDirs)].filter(isPublished).sort()
  const reached = new Set(directDirs)
  const queue = [...directDirs]

  while (queue.length > 0) {
    const targetName = graph.get(queue.shift()).name
    for (const [dir, pkg] of graph) {
      if (reached.has(dir) || !isPublished(dir) || !pkg.dependencies.includes(targetName)) {
        continue
      }
      reached.add(dir)
      queue.push(dir)
    }
  }

  const toRef = (dir) => ({ name: graph.get(dir).name, dir })
  const viaDirs = [...reached].filter((dir) => !directDirs.includes(dir)).sort()

  return { direct: directDirs.map(toRef), via: viaDirs.map(toRef) }
}

async function readManifest({ file }) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return null
  }
}
