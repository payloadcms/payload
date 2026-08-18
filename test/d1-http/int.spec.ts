import type { Payload } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const postsSlug = 'd1-http-posts'

const hasCloudflareHttpCredentials = Boolean(
  process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_D1_DATABASE_ID &&
    process.env.CLOUDFLARE_API_TOKEN,
)

describe.skipIf(!hasCloudflareHttpCredentials)('D1 HTTP adapter (Cloudflare API)', () => {
  let payload: Payload
  let previousDropDatabase: string | undefined

  beforeAll(async () => {
    previousDropDatabase = process.env.PAYLOAD_DROP_DATABASE
    // Never drop a remote D1 over HTTP — vitest.setup defaults this to `true`.
    process.env.PAYLOAD_DROP_DATABASE = 'false'

    const initialized = await initPayloadInt(dirname)
    payload = initialized.payload
  })

  afterAll(async () => {
    if (previousDropDatabase === undefined) {
      delete process.env.PAYLOAD_DROP_DATABASE
    } else {
      process.env.PAYLOAD_DROP_DATABASE = previousDropDatabase
    }

    await payload.destroy()
  })

  it('should create and delete a document via Payload local API', async () => {
    const created = await payload.create({
      collection: postsSlug,
      data: {
        title: 'D1 HTTP integration',
      },
    })

    expect(created.title).toBe('D1 HTTP integration')

    await payload.delete({
      collection: postsSlug,
      id: created.id,
    })
  })
})
