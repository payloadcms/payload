import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const repositoryDirectory = path.resolve(packageDirectory, '../..')

describe('SQLite adapter runtime graph', () => {
  it.each(['db-sqlite', 'db-d1-sqlite'])(
    '%s should use the tooling-only facade export',
    (adapter) => {
      const source = readFileSync(
        path.join(repositoryDirectory, 'packages', adapter, 'src/index.ts'),
        'utf8',
      )

      expect(source).toContain("from '@payloadcms/drizzle/sqlite/create-require-drizzle-kit'")
      expect(source).toContain("'drizzle-kit/api'")
      expect(source).toContain('{ from: import.meta.url }')
      expect(source).not.toContain('@payloadcms/drizzle/sqlite/require-drizzle-kit')
    },
  )

  it('should not expose Drizzle Kit through the SQLite runtime barrel', () => {
    const source = readFileSync(path.join(packageDirectory, 'src/exports/sqlite.ts'), 'utf8')

    expect(source).not.toContain('requireDrizzleKit')
  })

  it('should publish separate facade and tooling entry points', () => {
    const packageJSON = JSON.parse(
      readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'),
    ) as { exports: Record<string, unknown>; publishConfig: { exports: Record<string, unknown> } }

    for (const exports of [packageJSON.exports, packageJSON.publishConfig.exports]) {
      expect(exports['./sqlite/create-require-drizzle-kit']).toBeDefined()
      expect(exports['./sqlite/require-drizzle-kit']).toBeUndefined()
    }
  })
})
