import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const performanceSourceRoots = [
  'packages/payload/src',
  'packages/drizzle/src',
  'packages/db-mongodb/src',
  'packages/db-postgres/src',
  'packages/db-sqlite/src',
  'packages/db-vercel-postgres/src',
  'packages/db-d1-sqlite/src',
  'test/version-branches/performance',
  'test/__helpers/int',
  'test/__helpers/shared',
]

export const performanceSourceFiles = [
  'package.json',
  'pnpm-lock.yaml',
  'vitest.config.ts',
  'test/vitest.setup.ts',
  'test/buildConfigWithDefaults.ts',
  'test/dbAdapters.ts',
  'tsconfig.base.json',
  'test/tsconfig.json',
]

/** Match deleted or renamed HEAD inputs using the same inclusion rules as current files. */
export const isPerformanceSourcePath = ({ path }) => {
  if (performanceSourceFiles.includes(path)) return true
  if (
    performanceSourceRoots.some(
      (root) => root.startsWith('packages/') && path === root.replace(/\/src$/, '/package.json'),
    )
  )
    return true
  const root = performanceSourceRoots.find((root) => path.startsWith(`${root}/`))
  if (!root) return false
  const segments = path.slice(root.length + 1).split('/')
  if (segments.includes('node_modules')) return false
  const isBenchmark = root === 'test/version-branches/performance'
  if (
    isBenchmark &&
    (segments.some((segment) =>
      ['diagnostic', 'final', 'results', '__results__'].includes(segment),
    ) ||
      ['RESULTS.md', 'NATIVE-PLANS.md'].includes(segments.at(-1)))
  )
    return false
  return (isBenchmark ? /\.(?:[cm]?[jt]sx?|json|sql|md)$/ : /\.(?:[cm]?[jt]sx?|json|sql)$/).test(
    path,
  )
}

/** Include uncommitted and new implementation files, but exclude generated result documents. */
export const getPerformanceSourceDigest = async ({
  root = fileURLToPath(new URL('../../../', import.meta.url)),
  includePaths = false,
} = {}) => {
  const files = []
  const collect = async ({ directory, isBenchmark }) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)

      if (
        entry.isDirectory() &&
        entry.name !== 'node_modules' &&
        !(isBenchmark && ['diagnostic', 'final', 'results', '__results__'].includes(entry.name))
      ) {
        await collect({ directory: path, isBenchmark })
      } else if (
        entry.isFile() &&
        !(isBenchmark && ['RESULTS.md', 'NATIVE-PLANS.md'].includes(entry.name)) &&
        (isBenchmark ? /\.(?:[cm]?[jt]sx?|json|sql|md)$/ : /\.(?:[cm]?[jt]sx?|json|sql)$/).test(
          entry.name,
        )
      ) {
        files.push(path)
      }
    }
  }

  for (const source of performanceSourceRoots) {
    await collect({
      directory: join(root, source),
      isBenchmark: source === 'test/version-branches/performance',
    })
    if (source.startsWith('packages/')) files.push(join(root, source, '../package.json'))
  }
  files.push(...performanceSourceFiles.map((file) => join(root, file)))
  const hash = createHash('sha256')

  for (const path of files.sort()) {
    const body = await readFile(path)

    hash.update(`${relative(root, path)}\0${body.length}:`)
    hash.update(body)
  }
  return {
    algorithm: 'sha256',
    files: files.length,
    roots: performanceSourceRoots,
    value: hash.digest('hex'),
    ...(includePaths ? { paths: files.map((path) => relative(root, path)) } : {}),
  }
}
