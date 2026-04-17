import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

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

  describe('nested folder population with depth', () => {
    it('should populate all nested subfolders for multiple root folders when queried with depth', async () => {
      const ROOT_FOLDER_COUNT = 8
      const NESTED_FOLDER_COUNT = 10

      // Create root folders
      const rootFolders: { id: number | string; name: string }[] = []
      for (let i = 1; i <= ROOT_FOLDER_COUNT; i++) {
        const rootFolder = await payload.create({
          collection: 'payload-folders',
          data: {
            name: `Root Folder ${i}`,
            folderType: ['posts'],
          },
        })
        rootFolders.push({ id: rootFolder.id, name: rootFolder.name })

        // Create nested subfolders for each root folder
        for (let j = 1; j <= NESTED_FOLDER_COUNT; j++) {
          await payload.create({
            collection: 'payload-folders',
            data: {
              name: `Root ${i} - Subfolder ${j}`,
              folder: rootFolder.id,
              folderType: ['posts'],
            },
          })
        }
      }

      // Query root folders (folder: { exists: false }) with depth
      const result = await payload.find({
        collection: 'payload-folders',
        depth: 3,
        limit: 10000,
        where: {
          and: [{ folderType: { contains: 'posts' } }, { folder: { exists: false } }],
        },
      })

      // Should return all 8 root folders
      expect(result.docs).toHaveLength(ROOT_FOLDER_COUNT)

      // Each root folder should have all 10 nested subfolders populated
      for (const rootFolder of result.docs) {
        const nestedFolders = rootFolder.documentsAndFolders?.docs?.filter(
          (doc: any) => doc.relationTo === 'payload-folders',
        )

        expect(nestedFolders).toHaveLength(NESTED_FOLDER_COUNT)
      }

      // Verify total nested folder count
      const totalNestedFolders = result.docs.reduce((acc, folder) => {
        const nested =
          folder.documentsAndFolders?.docs?.filter(
            (doc: any) => doc.relationTo === 'payload-folders',
          ) || []
        return acc + nested.length
      }, 0)

      expect(totalNestedFolders).toBe(ROOT_FOLDER_COUNT * NESTED_FOLDER_COUNT)
    })

    it('should populate nested subfolders consistently regardless of query order', async () => {
      // Create 4 root folders with 5 subfolders each
      const rootFolders: { id: number | string }[] = []
      for (let i = 1; i <= 4; i++) {
        const rootFolder = await payload.create({
          collection: 'payload-folders',
          data: {
            name: `Root ${i}`,
            folderType: ['posts'],
          },
        })
        rootFolders.push({ id: rootFolder.id })

        for (let j = 1; j <= 5; j++) {
          await payload.create({
            collection: 'payload-folders',
            data: {
              name: `Root ${i} - Sub ${j}`,
              folder: rootFolder.id,
              folderType: ['posts'],
            },
          })
        }
      }

      // Query with different sort orders and verify consistent results
      const ascResult = await payload.find({
        collection: 'payload-folders',
        depth: 2,
        limit: 100,
        sort: 'name',
        where: {
          folder: { exists: false },
          folderType: { contains: 'posts' },
        },
      })

      const descResult = await payload.find({
        collection: 'payload-folders',
        depth: 2,
        limit: 100,
        sort: '-name',
        where: {
          folder: { exists: false },
          folderType: { contains: 'posts' },
        },
      })

      // Both queries should return 4 root folders
      expect(ascResult.docs).toHaveLength(4)
      expect(descResult.docs).toHaveLength(4)

      // Both should have same total nested folders
      const ascNestedCount = ascResult.docs.reduce(
        (acc, f) =>
          acc +
          (f.documentsAndFolders?.docs?.filter((d: any) => d.relationTo === 'payload-folders')
            ?.length || 0),
        0,
      )
      const descNestedCount = descResult.docs.reduce(
        (acc, f) =>
          acc +
          (f.documentsAndFolders?.docs?.filter((d: any) => d.relationTo === 'payload-folders')
            ?.length || 0),
        0,
      )

      expect(ascNestedCount).toBe(20) // 4 roots * 5 subfolders
      expect(descNestedCount).toBe(20)
    })

    it('should correctly paginate nested subfolders within polymorphic joins', async () => {
      // Create a folder with 12 subfolders to test pagination
      const parentFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          name: 'Parent with many subfolders',
          folderType: ['posts'],
        },
      })

      // Create 12 subfolders with zero-padded names for consistent sorting
      for (let i = 1; i <= 12; i++) {
        await payload.create({
          collection: 'payload-folders',
          data: {
            name: `Subfolder ${String(i).padStart(2, '0')}`,
            folder: parentFolder.id,
            folderType: ['posts'],
          },
        })
      }

      // Query with limit of 5 on the join - should get first 5 subfolders
      const page1Result = await payload.findByID({
        id: parentFolder.id,
        collection: 'payload-folders',
        joins: {
          documentsAndFolders: {
            limit: 5,
            sort: 'name',
          },
        },
      })

      expect(page1Result.documentsAndFolders?.docs?.length).toBeLessThanOrEqual(5)
      expect(page1Result.documentsAndFolders?.docs?.length).toBeGreaterThan(0)

      // Query page 2 - should get next batch of subfolders
      const page2Result = await payload.findByID({
        id: parentFolder.id,
        collection: 'payload-folders',
        joins: {
          documentsAndFolders: {
            limit: 5,
            page: 2,
            sort: 'name',
          },
        },
      })

      expect(page2Result.documentsAndFolders?.docs?.length).toBeGreaterThan(0)
      expect(page2Result.documentsAndFolders?.docs?.length).toBeLessThanOrEqual(5)

      // Verify no overlap between pages by checking names
      const page1Names = page1Result.documentsAndFolders?.docs?.map(
        (d: any) => d.value?.name,
      ) as string[]
      const page2Names = page2Result.documentsAndFolders?.docs?.map(
        (d: any) => d.value?.name,
      ) as string[]

      // Page 1 and page 2 should have no overlap
      const page1Set = new Set(page1Names)
      const hasOverlap = page2Names.some((name) => page1Set.has(name))
      expect(hasOverlap).toBe(false)

      // Page 1 names should come before page 2 names alphabetically
      const lastPage1Name = page1Names[page1Names.length - 1]
      const firstPage2Name = page2Names[0]
      expect(lastPage1Name < firstPage2Name).toBe(true)
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

    it('should populate subfolders and documents for folder by ID', async () => {
      const parentFolder = await payload.create({
        collection: 'payload-folders',
        data: { name: 'Parent Folder' },
      })
      const childFolder = await payload.create({
        collection: 'payload-folders',
        data: { name: 'Child Folder', folder: parentFolder.id, folderType: ['posts'] },
      })
      const childDocument = await payload.create({
        collection: 'posts',
        data: { title: 'Child Document', folder: parentFolder.id },
      })
      const parentFolderQuery = await payload.findByID({
        collection: 'payload-folders',
        id: parentFolder.id,
        joins: {
          documentsAndFolders: {
            limit: 100000000,
            sort: 'name',
            where: {
              or: [
                {
                  and: [
                    { relationTo: { equals: 'payload-folders' } },
                    {
                      or: [{ folderType: { in: ['posts'] } }, { folderType: { exists: false } }],
                    },
                  ],
                },
                {
                  and: [{ relationTo: { equals: 'posts' } }],
                },
              ],
            },
          },
        },
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

    it('should populate non-trashed documents when collection has both folders and trash enabled', async () => {
      const parentFolder = await payload.create({
        collection: 'payload-folders',
        data: {
          folderType: ['posts'],
          name: 'Posts Folder',
        },
      })

      await payload.create({
        collection: 'posts',
        data: {
          title: 'Post 1',
          folder: parentFolder.id,
        },
      })

      await payload.create({
        collection: 'posts',
        data: {
          title: 'Post 2',
          folder: parentFolder.id,
        },
      })

      // Create a post that will be trashed
      const post3 = await payload.create({
        collection: 'posts',
        data: {
          title: 'Post 3 (to be trashed)',
          folder: parentFolder.id,
        },
      })

      // Trash post3
      await payload.delete({
        collection: 'posts',
        id: post3.id,
      })

      const parentFolderQuery = await payload.findByID({
        collection: 'payload-folders',
        id: parentFolder.id,
        joins: {
          documentsAndFolders: {
            where: {
              or: [
                {
                  deletedAt: {
                    exists: false,
                  },
                },
              ],
            },
          },
        },
      })

      // Should only see 2 non-trashed posts, not the trashed one
      expect(parentFolderQuery.documentsAndFolders?.docs).toHaveLength(2)

      // Verify the correct posts are returned
      const returnedDocs = parentFolderQuery.documentsAndFolders?.docs
      expect(returnedDocs).toHaveLength(2)

      expect(returnedDocs?.some((doc) => (doc.value as any).title === 'Post 1')).toBe(true)
      expect(returnedDocs?.some((doc) => (doc.value as any).title === 'Post 2')).toBe(true)
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
