import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const workspaceDirectory = fileURLToPath(new URL('../../../../', import.meta.url))
const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true })
  }
})

describe('SQLite Drizzle Kit tooling in Node', () => {
  it.each(['db-sqlite', 'db-d1-sqlite'])(
    'should resolve real tooling from %s outside Vitest and generate and apply schema changes',
    async (adapter) => {
      const directory = mkdtempSync(path.join(tmpdir(), 'payload-drizzle-tooling-'))
      temporaryDirectories.push(directory)

      // Exercise the real factory and dynamicImport implementation without loading all of Payload.
      await build({
        alias: {
          payload: path.join(workspaceDirectory, 'packages/payload/src/utilities/dynamicImport.ts'),
        },
        bundle: true,
        entryPoints: [
          path.join(workspaceDirectory, 'packages/drizzle/src/sqlite/createRequireDrizzleKit.ts'),
        ],
        format: 'esm',
        logLevel: 'silent',
        outfile: path.join(directory, 'tooling.mjs'),
        platform: 'node',
      })

      const from = pathToFileURL(
        path.join(workspaceDirectory, 'packages', adapter, 'src/index.ts'),
      ).href
      const sqliteFrom = pathToFileURL(
        path.join(workspaceDirectory, 'packages/db-sqlite/src/index.ts'),
      ).href
      const script = path.join(directory, 'check.mjs')

      writeFileSync(
        script,
        `
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createRequireDrizzleKit } from './tooling.mjs'
const require = createRequire(${JSON.stringify(sqliteFrom)})
const { createClient } = require('@libsql/client')
const { drizzle } = require('drizzle-orm/libsql')
const { sqliteTable, integer } = require('drizzle-orm/sqlite-core')
assert.equal(process.env.VITEST, undefined)
const tooling = createRequireDrizzleKit({ from: ${JSON.stringify(from)}, packageName: ${JSON.stringify(`@payloadcms/${adapter}`)} })()
const schema = { probe: sqliteTable('probe', { id: integer('id').primaryKey() }) }
const before = await tooling.generateDrizzleJson({})
const after = await tooling.generateDrizzleJson(schema)
const statements = await tooling.generateMigration(before, after)
assert.ok(statements.some(sql => sql.includes('CREATE TABLE')))
const client = createClient({ url: 'file::memory:' })
try {
  const pushed = await tooling.pushSchema(schema, drizzle(client))
  await pushed.apply()
  await client.execute('INSERT INTO probe (id) VALUES (42)')
  const result = await client.execute('SELECT id FROM probe')
  assert.equal(result.rows[0].id, 42)
  await client.execute('DELETE FROM probe')
  await client.execute('DROP TABLE probe')
  console.log('schema tooling passed')
} finally {
  client.close()
}
`,
      )

      const env = { ...process.env }
      delete env.VITEST

      const output = execFileSync(process.execPath, [script], {
        encoding: 'utf8',
        env,
        timeout: 30_000,
      })

      expect(output).toContain('schema tooling passed')
    },
  )
})
