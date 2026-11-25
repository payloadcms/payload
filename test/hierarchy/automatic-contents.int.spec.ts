import { createPayloadRequest } from 'payload'
import { getHierarchyFieldName } from 'payload/shared'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  automaticFoldersSlug as folders,
  automaticMediaSlug as media,
  automaticPagesSlug as pages,
} from './collections/automaticContents.js'

test.suite(
  'Automatic hierarchy contents',
  {
    config: './automatic-contents.config.ts',
    db: (adapter) => !['content-api', 'cosmosdb', 'documentdb', 'firestore'].includes(adapter),
  },
  () => {
    test('should load generated folder contents through the standard joins option', async ({
      payload,
    }) => {
      const folder = await payload.create({
        collection: folders,
        data: { name: 'Editorial' },
        overrideAccess: true,
      })

      const folderField = getHierarchyFieldName(folders)
      const page = await payload.create({
        collection: pages,
        data: { [folderField]: folder.id, title: 'Editorial guide', visible: true },
        overrideAccess: true,
      })
      const photo = await payload.create({
        collection: media,
        data: { [folderField]: folder.id, title: 'Garden photos', visible: true },
        overrideAccess: true,
      })

      await payload.create({
        collection: pages,
        data: { [folderField]: folder.id, title: 'Internal planning memo', visible: false },
        overrideAccess: true,
      })

      const user = await payload.create({
        collection: 'users',
        data: { email: devUser.email, password: devUser.password },
        overrideAccess: true,
      })

      const req = await createPayloadRequest({ payload, user: { ...user, collection: 'users' } })
      const pageReadAccess = vi.spyOn(payload.collections[pages].config.access, 'read')
      const folderRead = {
        id: folder.id,
        collection: folders,
        depth: 0,
        overrideAccess: false,
        req,
      } as const

      const ordinary = await payload.findByID(folderRead)
      const list = await payload.find({
        collection: folders,
        depth: 0,
        joins: {},
        overrideAccess: false,
        req,
      })
      expect(ordinary).toHaveProperty('_h_contents')
      expect(list.docs[0]).toHaveProperty('_h_contents')

      const paged = await payload.find({
        collection: folders,
        depth: 0,
        joins: { _h_contents: { count: true, limit: 2, page: 1 } },
        overrideAccess: false,
        req,
      })

      expect(paged.docs[0]?._h_contents).toMatchObject({
        docs: expect.arrayContaining([
          expect.objectContaining({ relationTo: pages, value: page.id }),
          expect.objectContaining({ relationTo: media, value: photo.id }),
        ]),
        hasNextPage: false,
        totalDocs: 2,
      })

      pageReadAccess.mockClear()
      const withoutContents = await payload.findByID({
        ...folderRead,
        joins: { _h_contents: false },
      })

      expect(withoutContents._h_contents?.docs ?? []).toEqual([])
      expect(pageReadAccess).not.toHaveBeenCalled()
      pageReadAccess.mockRestore()
    })
  },
)
