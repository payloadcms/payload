import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// oxlint-disable-next-line payload/no-relative-monorepo-imports -- Build-time generator reads the canonical release list.
import { packagePublishList } from '../releaser/src/lib/publishList.ts'

const sourceDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(sourceDir, '../..')
const cliPackages = ['create-payload-app', 'codemod']

/** Bundle one canonical implementation and the current publish list in each standalone CLI. */
export function prepareUpgradeSources({ packages = cliPackages } = {}) {
  const names = packagePublishList.map((directory) => {
    const packagePath = join(rootDir, 'packages', directory, 'package.json')
    return JSON.parse(readFileSync(packagePath, 'utf8')).name
  })
  const generatedList = `// Generated from the release publish list. Do not edit.\nexport const payloadPackageNames = ${JSON.stringify(names, null, 2)} as const\n`

  for (const name of packages) {
    if (!cliPackages.includes(name)) {
      throw new Error(`Unknown CLI package: ${name}`)
    }
    const targetDir = join(rootDir, 'packages', name, 'src', 'upgrade-shared')
    mkdirSync(targetDir, { recursive: true })
    for (const file of readdirSync(sourceDir)) {
      if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
        copyFileSync(join(sourceDir, file), join(targetDir, file))
      }
    }
    writeFileSync(join(targetDir, 'payload-package-names.ts'), generatedList)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareUpgradeSources({ packages: process.argv.length > 2 ? process.argv.slice(2) : cliPackages })
}
