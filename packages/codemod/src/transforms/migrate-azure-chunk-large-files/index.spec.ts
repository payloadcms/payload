import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateAzureChunkLargeFiles } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-azure-chunk-large-files', () => {
  it('collapses clientUploads: { chunkLargeFiles: true } to clientUploads: true', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateAzureChunkLargeFiles })

    expect(result).toBe(output)
  })

  it('removes chunkLargeFiles but keeps other clientUploads options', async () => {
    const input = await fixture('with-access.input.ts')
    const output = await fixture('with-access.output.ts')

    const result = await runTransform({ source: input, transform: migrateAzureChunkLargeFiles })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateAzureChunkLargeFiles })

    expect(result).toBe(output)
  })

  it('no-ops on clientUploads that never set chunkLargeFiles', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({ source: input, transform: migrateAzureChunkLargeFiles })

    expect(result).toBe(output)
  })

  it('no-ops on non-azure storage adapters', async () => {
    const input = `import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'

export default buildConfig({
  storage: [
    s3Storage({
      bucket: 'my-bucket',
      collections: { media: true },
      clientUploads: { chunkLargeFiles: true },
    }),
  ],
})
`

    const result = await runTransform({ source: input, transform: migrateAzureChunkLargeFiles })

    expect(result).toBe(input)
  })
})
