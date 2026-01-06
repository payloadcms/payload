import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('folders-browse-by-disabled', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  beforeEach(async () => {
    await payload.delete({
      collection: 'posts',
      depth: 0,
      where: {
        id: {
          exists: true,
        },
      },
    })
    await payload.delete({
      collection: 'payload-folders',
      depth: 0,
      where: {
        id: {
          exists: true,
        },
      },
    })
  })

  describe('folder > subfolder querying', () => {
    it('should populate subfolders for folder by ID', async () => {
      const parentFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Parent Folder',
        },
      })
      const folderIDFromParams = parentFolder.id

      await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Nested 1',
          folder: folderIDFromParams,
        },
      })

      await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Nested 2',
          folder: folderIDFromParams,
        },
      })

      const parentFolderQuery = await payload.findByID({
        collection: 'payload-folders',
        id: folderIDFromParams,
      })

      expect(parentFolderQuery.documentsAndFolders.docs).toHaveLength(2)
    })
  })

  describe('folder > file querying', () => {
    it('should populate files for folder by ID', async () => {
      const parentFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Parent Folder',
        },
      })
      const folderIDFromParams = parentFolder.id

      await payload.create({
        collection: 'posts',
        data: {
          title: 'Post 1',
          folder: folderIDFromParams,
        },
      })

      await payload.create({
        collection: 'posts',
        data: {
          title: 'Post 2',
          folder: folderIDFromParams,
        },
      })

      const parentFolderQuery = await payload.findByID({
        collection: 'payload-folders',
        id: folderIDFromParams,
      })

      expect(parentFolderQuery.documentsAndFolders.docs).toHaveLength(2)
    })
  })

  describe('hooks', () => {
    it('reparentChildFolder should change the child after updating the parent', async () => {
      const parentFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Parent Folder',
        },
      })

      const childFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Child Folder',
          folder: parentFolder,
        },
      })

      await payload.update({
        collection: 'payload-folders',
        data: { folder: childFolder },
        id: parentFolder.id,
      })

      const parentAfter = await payload.findByID({
        collection: 'payload-folders',
        id: parentFolder.id,
        depth: 0,
      })
      const childAfter = await payload.findByID({
        collection: 'payload-folders',
        id: childFolder.id,
        depth: 0,
      })
      expect(childAfter.folder).toBeFalsy()
      expect(parentAfter.folder).toBe(childFolder.id)
    })

    it('dissasociateAfterDelete should delete _folder value in children after deleting the folder', async () => {
      const parentFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Parent Folder',
        },
      })

      const post = await payload.create({ collection: 'posts', data: { folder: parentFolder } })

      await payload.delete({ collection: 'payload-folders', id: parentFolder.id })
      const postAfter = await payload.findByID({ collection: 'posts', id: post.id })
      expect(postAfter.folder).toBeFalsy()
    })

    it('deleteSubfoldersBeforeDelete deletes subfolders after deleting the parent folder', async () => {
      const parentFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Parent Folder',
        },
      })
      const childFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Child Folder',
          folder: parentFolder,
        },
      })

      await payload.delete({ collection: 'payload-folders', id: parentFolder.id })

      await expect(
        payload.findByID({
          collection: 'payload-folders',
          id: childFolder.id,
          disableErrors: true,
        }),
      ).resolves.toBeNull()
    })
  })
})
