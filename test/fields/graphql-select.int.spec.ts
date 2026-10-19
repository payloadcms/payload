import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { uploadsPoly, uploadsSlug } from './slugs.js'

test.suite('GraphQL select projection', { config: './config.ts' }, () => {
  test('should project fields from a polymorphic upload value', async ({ payload, restClient }) => {
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
