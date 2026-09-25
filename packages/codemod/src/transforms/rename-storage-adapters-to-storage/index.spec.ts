import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { renameStorageAdaptersToStorage } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('rename-storage-adapters-to-storage', () => {
  it('renames storageAdapters to storage', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: renameStorageAdaptersToStorage })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: renameStorageAdaptersToStorage })

    expect(result).toBe(output)
  })

  it('no-ops on unrelated code', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({ source: input, transform: renameStorageAdaptersToStorage })

    expect(result).toBe(output)
  })

  it('skips rename when storage property already exists on the same object', async () => {
    const alreadyRenamed = `import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [],
  storage: [
    s3Storage({ bucket: 'my-bucket', collections: { media: true }, config: {} }),
  ],
})
`
    const result = await runTransform({
      source: alreadyRenamed,
      transform: renameStorageAdaptersToStorage,
    })

    expect(result).toBe(alreadyRenamed)
  })
})
