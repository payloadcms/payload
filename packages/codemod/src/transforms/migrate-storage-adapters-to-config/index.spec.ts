import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateStorageAdaptersToConfig } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-storage-adapters-to-config', () => {
  it('moves s3Storage from plugins to storage', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateStorageAdaptersToConfig })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateStorageAdaptersToConfig })

    expect(result).toBe(output)
  })

  it('no-ops on unrelated code', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({ source: input, transform: migrateStorageAdaptersToConfig })

    expect(result).toBe(output)
  })

  it('moves storage adapter but keeps non-storage plugins', async () => {
    const input = await fixture('mixed-plugins.input.ts')
    const output = await fixture('mixed-plugins.output.ts')

    const result = await runTransform({ source: input, transform: migrateStorageAdaptersToConfig })

    expect(result).toBe(output)
  })

  it('moves multiple storage adapters from plugins in one pass', async () => {
    const input = `import { s3Storage } from '@payloadcms/storage-s3'
import { gcsStorage } from '@payloadcms/storage-gcs'
import { buildConfig } from 'payload'

export default buildConfig({
  plugins: [
    s3Storage({ bucket: 'a', collections: { media: true }, config: {} }),
    gcsStorage({ bucket: 'b', collections: { media: true }, options: {} }),
  ],
})
`
    const result = await runTransform({ source: input, transform: migrateStorageAdaptersToConfig })

    expect(result).not.toContain('plugins')
    expect(result).toContain('storage')
    expect(result).toContain("s3Storage({ bucket: 'a'")
    expect(result).toContain("gcsStorage({ bucket: 'b'")
  })

  it('no-ops when storage already contains the adapter (idempotency on partial migration)', async () => {
    const alreadyMigrated = `import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  storage: [
    s3Storage({ bucket: 'my-bucket', collections: { media: true }, config: {} }),
  ],
})
`
    const result = await runTransform({
      source: alreadyMigrated,
      transform: migrateStorageAdaptersToConfig,
    })

    expect(result).toBe(alreadyMigrated)
  })
})
