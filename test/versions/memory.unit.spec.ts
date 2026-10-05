import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Config, Field } from 'payload'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { transform } from '@payloadcms/db-mongodb/internal'
import { buildConfig, buildVersionCollectionFields, getPayload } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/memory/vitest.js'

const versionReads = 10_000

// When flattened version fields were cached in a Map, these reads retained about 31 MiB.
// With the WeakMap they retain under 1 MiB. This limit allows runtime variance.
const maximumHeapIncrease = 10 * 1024 * 1024

test('should not retain memory across MongoDB version reads', async ({ measureMemoryUsage }) => {
  const config = await buildConfig(createVersionedPostsConfig())
  const payload = await getPayload({ config, disableDBConnect: true })
  const adapter = payload.db as unknown as MongooseAdapter
  const collectionConfig = payload.collections.posts.config

  const { memoryUsage } = await measureMemoryUsage({
    run: () => {
      for (let i = 0; i < versionReads; i++) {
        // Same as findVersions, queryDrafts and createVersion: version fields are built fresh for every read
        transform({
          adapter,
          data: { _id: `version-${i}`, parent: 'post', version: { field_0: 'value' } },
          fields: buildVersionCollectionFields(payload.config, collectionConfig),
          operation: 'read',
        })
      }
    },
  })

  await payload.destroy()

  expect(memoryUsage.heapUsed).toBeLessThan(maximumHeapIncrease)
})

const createVersionedPostsConfig = (): Config => ({
  collections: [
    {
      slug: 'posts',
      fields: Array.from(
        { length: 100 },
        (_, index): Field => ({ name: `field_${index}`, type: 'text' }),
      ),
      versions: {
        drafts: true,
      },
    },
  ],
  db: mongooseAdapter({ url: false }),
  logger: {
    options: {
      level: 'error',
    },
  },
  secret: 'mongodb-version-memory-test',
  telemetry: false,
  typescript: {
    autoGenerate: false,
  },
})
