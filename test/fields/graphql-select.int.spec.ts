import type { Payload } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { uploadsPoly, uploadsSlug } from './slugs.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
let payload: Payload
let restClient: NextRESTClient

describe('GraphQL select projection', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should project fields from a polymorphic upload value', async () => {
    const {
      docs: [document],
    } = await payload.find({
      collection: uploadsPoly,
      limit: 1,
      overrideAccess: true,
    })
    const query = `query {
      UploadsPoly(id: ${typeof document.id === 'string' ? `"${document.id}"` : document.id}, select: true) {
        media {
          relationTo
          value {
            ... on Upload {
              id
              text
            }
          }
        }
      }
    }`

    const { data, errors } = await restClient
      .GRAPHQL_POST({ body: JSON.stringify({ query }) })
      .then((response) => response.json())

    expect(errors).toBeUndefined()
    expect(data.UploadsPoly.media).toMatchObject({
      relationTo: uploadsSlug,
      value: {
        text: 'An upload here',
      },
    })
  })
})
