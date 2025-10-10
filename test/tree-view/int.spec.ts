import type { CollectionSlug, Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { Tag } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { slugs } from './shared.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function cleanupDocs({
  collectionSlug,
  ids,
  payload,
}: {
  collectionSlug: CollectionSlug
  ids: (number | string)[]
  payload: Payload
}) {
  await payload.delete({
    collection: collectionSlug,
    where: {
      id: {
        in: ids,
      },
    },
  })
}

describe('tree view', () => {
  beforeAll(async () => {
    const initResult = await initPayloadInt(dirname)

    payload = initResult.payload
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('tree paths', () => {
    async function createTags() {
      const mediaTag = (await payload.create({
        collection: slugs.tags,
        data: {
          name: 'Media',
        },
      })) as Tag

      const typeTag = (await payload.create({
        collection: slugs.tags,
        data: {
          name: 'Type',
          _parentDoc: mediaTag.id,
        },
      })) as Tag

      const headshotsTag = (await payload.create({
        collection: slugs.tags,
        data: {
          name: 'Headshots',
          _parentDoc: typeTag.id,
        },
      })) as Tag

      return {
        mediaTag,
        typeTag,
        headshotsTag,
      }
    }
    it('should generate correct paths', async () => {
      const { mediaTag, typeTag, headshotsTag } = await createTags()

      expect(headshotsTag.slugPath).toEqual('media/type/headshots')
      expect(headshotsTag.titlePath).toEqual('Media/Type/Headshots')

      await cleanupDocs({
        collectionSlug: slugs.tags,
        ids: [headshotsTag.id, typeTag.id, mediaTag.id],
        payload,
      })
    })

    it('should update paths on name change', async () => {
      const { mediaTag, typeTag, headshotsTag } = await createTags()

      await payload.update({
        collection: slugs.tags,
        id: typeTag.id,
        data: {
          name: 'Style',
        },
      })

      const updatedHeadshotsTag = (await payload.findByID({
        collection: slugs.tags,
        id: headshotsTag.id,
      })) as Tag

      expect(updatedHeadshotsTag.slugPath).toEqual('media/style/headshots')
      expect(updatedHeadshotsTag.titlePath).toEqual('Media/Style/Headshots')

      await cleanupDocs({
        collectionSlug: slugs.tags,
        ids: [headshotsTag.id, typeTag.id, mediaTag.id],
        payload,
      })
    })
  })
})
