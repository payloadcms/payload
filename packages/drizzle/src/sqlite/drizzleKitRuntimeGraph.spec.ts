import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const repositoryDirectory = path.resolve(packageDirectory, '../..')

describe('SQLite adapter runtime graph', () => {
  it.each(['db-sqlite', 'db-d1-sqlite'])(
    '%s should resolve Drizzle Kit from the adapter through the tooling-only facade export',
    (adapter) => {
      const source = readFileSync(
        path.join(repositoryDirectory, 'packages', adapter, 'src/index.ts'),
        'utf8',
      )

      expect(source).toContain("from '@payloadcms/drizzle/sqlite/create-require-drizzle-kit'")
      expect(source).toContain("'drizzle-kit/api'")
      expect(source).toContain('{ from: import.meta.url }')
      expect(source).not.toContain('dynamicImport<{ requireDrizzleKit: RequireDrizzleKit }>')
    },
  )

  it('should preserve the existing SQLite tooling exports without a static Drizzle Kit specifier', () => {
    const barrelSource = readFileSync(path.join(packageDirectory, 'src/exports/sqlite.ts'), 'utf8')
    const compatibilitySource = readFileSync(
      path.join(packageDirectory, 'src/sqlite/requireDrizzleKit.ts'),
      'utf8',
    )

    expect(barrelSource).toContain(
      "export { createRequireDrizzleKit } from '../sqlite/createRequireDrizzleKit.js'",
    )
    expect(barrelSource).toContain(
      "export { requireDrizzleKit } from '../sqlite/requireDrizzleKit.js'",
    )
    expect(compatibilitySource).not.toContain("require('drizzle-kit/api')")
  })

  it('should publish the tooling-only facade entry point', () => {
    const packageJSON = JSON.parse(
      readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'),
    ) as { exports: Record<string, unknown>; publishConfig: { exports: Record<string, unknown> } }

    for (const exports of [packageJSON.exports, packageJSON.publishConfig.exports]) {
      expect(exports['./sqlite/create-require-drizzle-kit']).toBeDefined()
    }
  })
})
