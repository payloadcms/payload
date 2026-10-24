import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { plainMediaSlug } from '../file-versioning/shared.js'
import { renameMediaDir } from './rename.config.js'

test.suite(
  'File rename with a single PostgreSQL connection',
  { config: './rename.config.ts', db: (adapter) => adapter === 'postgres' },
  () => {
    test.afterEach(async () => {
      await rm(renameMediaDir, { force: true, recursive: true })
    })

    test('should rename an upload without acquiring a second connection for its lock check', async ({
      payload,
    }) => {
      const bytes = Buffer.from('hello')
      const created = await payload.create({
        collection: plainMediaSlug,
        data: {},
        overrideAccess: true,
        file: { data: bytes, mimetype: 'text/plain', name: 'before.txt', size: bytes.length },
      })

      const renamed = await payload.renameFile({
        collection: plainMediaSlug,
        filename: 'after.txt',
        id: created.id,
        overrideAccess: true,
      })
      const stored = await payload.findByID({
        collection: plainMediaSlug,
        id: created.id,
        overrideAccess: true,
      })

      expect(renamed.id).toBe(created.id)
      expect(renamed.filename).toBe('after-original.txt')
      expect(stored.filename).toBe('after-original.txt')
      expect(await readFile(path.join(renameMediaDir, 'after-original.txt'))).toEqual(bytes)
    })
  },
)
