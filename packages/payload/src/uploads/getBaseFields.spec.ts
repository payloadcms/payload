import type { CollectionConfig, Config, PayloadRequest } from 'payload'

import { describe, expect, it } from 'vitest'

import { getBaseUploadFields } from './getBaseFields.js'

const createBranchRequest = (): PayloadRequest =>
  ({
    branch: 'campaign-work',
    context: {},
    payload: {
      config: {
        branching: { enabled: true },
        serverURL: 'http://localhost:3000',
      },
    },
  }) as PayloadRequest

describe('getBaseUploadFields', () => {
  it('should add the active branch to a custom internal admin thumbnail URL', async () => {
    const collection = {
      fields: [],
      slug: 'media',
      upload: {
        adminThumbnail: () => '/api/media/file/custom-thumbnail.jpg',
      },
    } as CollectionConfig
    const config = {
      routes: { api: '/api' },
      serverURL: 'http://localhost:3000',
    } as Config
    const thumbnailURLField = getBaseUploadFields({ collection, config }).find(
      (field) => 'name' in field && field.name === 'thumbnailURL',
    )
    const afterReadHook = thumbnailURLField?.hooks?.afterRead?.[0]

    expect(afterReadHook).toBeTypeOf('function')
    const thumbnailURL = await (
      afterReadHook as (args: {
        originalDoc: Record<string, unknown>
        req: PayloadRequest
      }) => unknown
    )({ originalDoc: { id: '1' }, req: createBranchRequest() })

    expect(thumbnailURL).toBe('/api/media/file/custom-thumbnail.jpg?branch=campaign-work')
  })
})
