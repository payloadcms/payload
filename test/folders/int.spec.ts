import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('folders', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  beforeEach(async () => {
    await payload.delete({
      collection: 'payload-folders',
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
          folderType: ['posts'],
        },
      })
      const folderIDFromParams = parentFolder.id

      await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Nested 1',
          folder: folderIDFromParams,
          folderType: ['posts'],
        },
      })

      await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Nested 2',
          folder: folderIDFromParams,
          folderType: ['posts'],
        },
      })

      const parentFolderQuery = await payload.findByID({
        collection: 'payload-folders',
        id: folderIDFromParams,
      })

      expect(parentFolderQuery.documentsAndFolders?.docs).toHaveLength(2)
    })
  })

  describe('folder > file querying', () => {
    it('should populate files for folder by ID', async () => {
      const parentFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          folderType: ['posts'],
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

      expect(parentFolderQuery.documentsAndFolders?.docs).toHaveLength(2)
    })
  })

  describe('hooks', () => {
    it('reparentChildFolder should change the child after updating the parent', async () => {
      const parentFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          folderType: ['posts'],
          name: 'Parent Folder',
        },
      })

      const childFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          folderType: ['posts'],
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
          folderType: ['posts'],
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
          folderType: ['posts'],
          name: 'Parent Folder',
        },
      })
      const childFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Child Folder',
          folder: parentFolder,
          folderType: ['posts'],
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

    describe('ensureSafeCollectionsChange', () => {
      it('should prevent narrowing scope of a folder if it contains documents of a removed type', async () => {
        const sharedFolder = await payload.create({
          collection: 'payload-folders',
          data: {
            name: 'Posts and Drafts Folder',
            folderType: ['posts', 'drafts'],
          },
        })

        await payload.create({
          collection: 'posts',
          data: {
            title: 'Post 1',
            folder: sharedFolder.id,
          },
        })

        await payload.create({
          collection: 'drafts',
          data: {
            title: 'Post 1',
            folder: sharedFolder.id,
          },
        })

        try {
          const updatedFolder = await payload.update({
            collection: 'payload-folders',
            id: sharedFolder.id,
            data: {
              folderType: ['posts'],
            },
          })

          expect(updatedFolder).not.toBeDefined()
        } catch (e: any) {
          expect(e.message).toBe(
            'The folder "Posts and Drafts Folder" contains documents that still belong to the following collections: Drafts',
          )
        }
      })

      it('should prevent adding scope to a folder if it contains documents outside of the new scope', async () => {
        const folderAcceptsAnything = await payload.create({
          collection: 'payload-folders',
          data: {
            name: 'Anything Goes',
            folderType: [],
          },
        })

        await payload.create({
          collection: 'posts',
          data: {
            title: 'Post 1',
            folder: folderAcceptsAnything.id,
          },
        })

        try {
          const scopedFolder = await payload.update({
            collection: 'payload-folders',
            id: folderAcceptsAnything.id,
            data: {
              folderType: ['posts'],
            },
          })

          expect(scopedFolder).not.toBeDefined()
        } catch (e: any) {
          expect(e.message).toBe(
            'The folder "Anything Goes" contains documents that still belong to the following collections: Posts',
          )
        }
      })

      it('should prevent narrowing scope of a folder if subfolders are assigned to any of the removed types', async () => {
        const parentFolder = await payload.create({
          collection: 'payload-folders',
          data: {
            name: 'Parent Folder',
            folderType: ['posts', 'drafts'],
          },
        })

        await payload.create({
          collection: 'payload-folders',
          data: {
            name: 'Parent Folder',
            folderType: ['posts', 'drafts'],
            folder: parentFolder.id,
          },
        })

        try {
          const updatedParent = await payload.update({
            collection: 'payload-folders',
            id: parentFolder.id,
            data: {
              folderType: ['posts'],
            },
          })

          expect(updatedParent).not.toBeDefined()
        } catch (e: any) {
          expect(e.message).toBe(
            'The folder "Parent Folder" contains folders that still belong to the following collections: Drafts',
          )
        }
      })

      it('should prevent widening scope on a scoped subfolder', async () => {
        const unscopedFolder = await payload.create({
          collection: 'payload-folders',
          data: {
            name: 'Parent Folder',
            folderType: [],
          },
        })

        const level1Folder = await payload.create({
          collection: 'payload-folders',
          data: {
            name: 'Level 1 Folder',
            folderType: ['posts', 'drafts'],
            folder: unscopedFolder.id,
          },
        })

        try {
          const level2UnscopedFolder = await payload.create({
            collection: 'payload-folders',
            data: {
              name: 'Level 2 Folder',
              folder: level1Folder.id,
              folderType: [],
            },
          })

          expect(level2UnscopedFolder).not.toBeDefined()
        } catch (e: any) {
          expect(e.message).toBe(
            'The folder "Level 2 Folder" must have folder-type set since its parent folder "Level 1 Folder" has a folder-type set.',
          )
        }
      })
    })
  })
})
