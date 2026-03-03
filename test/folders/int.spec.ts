import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { categoriesSlug, folderSlug, postSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('folders', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
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
    it('should prevent moving a folder into its own subfolder', async () => {
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

      await expect(
        payload.update({
          collection: 'payload-folders',
          data: { folder: childFolder },
          id: parentFolder.id,
        }),
      ).rejects.toThrow('Cannot move folder into its own subfolder')
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
          // eslint-disable-next-line vitest/no-conditional-expect
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
          // eslint-disable-next-line vitest/no-conditional-expect
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
          // eslint-disable-next-line vitest/no-conditional-expect
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
          // eslint-disable-next-line vitest/no-conditional-expect
          expect(e.message).toBe(
            'The folder "Level 2 Folder" must have folder-type set since its parent folder "Level 1 Folder" has a folder-type set.',
          )
        }
      })
    })
  })

  describe('findRelated API endpoint', () => {
    it('should return 401 when not authenticated', async () => {
      const folder = await payload.create({
        collection: folderSlug,
        data: { name: 'Test Folder' },
      })

      const response = await restClient.GET(`/${folderSlug}/${folder.id}/related`, {
        headers: {},
      })

      expect(response.status).toBe(401)
    })

    it('should return child folders for a parent folder', async () => {
      const parentFolder = await payload.create({
        collection: folderSlug,
        data: { name: 'Parent Folder' },
      })

      const child1 = await payload.create({
        collection: folderSlug,
        data: { name: 'Child 1', folder: parentFolder.id },
      })

      const child2 = await payload.create({
        collection: folderSlug,
        data: { name: 'Child 2', folder: parentFolder.id },
      })

      const response = await restClient.GET(`/${folderSlug}/${parentFolder.id}/related`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[folderSlug]).toBeDefined()
      expect(result[folderSlug].docs).toHaveLength(2)

      const childIds = result[folderSlug].docs.map((d: any) => d.id)
      expect(childIds).toContain(child1.id)
      expect(childIds).toContain(child2.id)
    })

    it('should return related documents from other collections', async () => {
      const folder = await payload.create({
        collection: folderSlug,
        data: { name: 'Posts Folder', folderType: ['posts'] },
      })

      const post1 = await payload.create({
        collection: postSlug,
        data: { title: 'Post 1', folder: folder.id },
      })

      const post2 = await payload.create({
        collection: postSlug,
        data: { title: 'Post 2', folder: folder.id },
      })

      const response = await restClient.GET(`/${folderSlug}/${folder.id}/related`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[postSlug]).toBeDefined()
      expect(result[postSlug].docs).toHaveLength(2)

      const postIds = result[postSlug].docs.map((d: any) => d.id)
      expect(postIds).toContain(post1.id)
      expect(postIds).toContain(post2.id)
    })

    it('should return both child folders and related documents', async () => {
      const parentFolder = await payload.create({
        collection: folderSlug,
        data: { name: 'Mixed Folder' },
      })

      await payload.create({
        collection: folderSlug,
        data: { name: 'Subfolder', folder: parentFolder.id },
      })

      await payload.create({
        collection: postSlug,
        data: { title: 'Post in Folder', folder: parentFolder.id },
      })

      const response = await restClient.GET(`/${folderSlug}/${parentFolder.id}/related`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[folderSlug].docs).toHaveLength(1)
      expect(result[postSlug].docs).toHaveLength(1)
    })

    it('should respect pagination parameters', async () => {
      const parentFolder = await payload.create({
        collection: folderSlug,
        data: { name: 'Paginated Folder' },
      })

      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: folderSlug,
          data: { name: `Child ${i}`, folder: parentFolder.id },
        })
      }

      const response = await restClient.GET(
        `/${folderSlug}/${parentFolder.id}/related?limit=2&page=1`,
      )
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[folderSlug].docs).toHaveLength(2)
      expect(result[folderSlug].totalDocs).toBe(5)
      expect(result[folderSlug].totalPages).toBe(3)
      expect(result[folderSlug].hasNextPage).toBe(true)
    })

    it('should return empty results for folder with no children', async () => {
      const emptyFolder = await payload.create({
        collection: folderSlug,
        data: { name: 'Empty Folder' },
      })

      const response = await restClient.GET(`/${folderSlug}/${emptyFolder.id}/related`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[folderSlug].docs).toHaveLength(0)
    })
  })

  describe('tag-style hierarchy (categories)', () => {
    beforeEach(async () => {
      await payload.delete({
        collection: categoriesSlug,
        where: { id: { exists: true } },
      })
      await payload.delete({
        collection: postSlug,
        where: { id: { exists: true } },
      })
    })

    it('should allow documents to have multiple tags', async () => {
      const tag1 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Tag 1' },
      })

      const tag2 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Tag 2' },
      })

      const tag3 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Tag 3' },
      })

      const post = await payload.create({
        collection: postSlug,
        data: {
          title: 'Multi-tagged Post',
          [`_h_${categoriesSlug}`]: [tag1.id, tag2.id, tag3.id],
        },
      })

      const fetchedPost = await payload.findByID({
        collection: postSlug,
        id: post.id,
        depth: 0,
      })

      expect(fetchedPost[`_h_${categoriesSlug}`]).toHaveLength(3)
      expect(fetchedPost[`_h_${categoriesSlug}`]).toContain(tag1.id)
      expect(fetchedPost[`_h_${categoriesSlug}`]).toContain(tag2.id)
      expect(fetchedPost[`_h_${categoriesSlug}`]).toContain(tag3.id)
    })

    it('should find documents by single tag', async () => {
      const targetTag = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Target Tag' },
      })

      const otherTag = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Other Tag' },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Post with Target',
          [`_h_${categoriesSlug}`]: [targetTag.id],
        },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Post with Both',
          [`_h_${categoriesSlug}`]: [targetTag.id, otherTag.id],
        },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Post with Other',
          [`_h_${categoriesSlug}`]: [otherTag.id],
        },
      })

      const results = await payload.find({
        collection: postSlug,
        where: {
          [`_h_${categoriesSlug}`]: { in: [targetTag.id] },
        },
      })

      expect(results.docs).toHaveLength(2)
      const titles = results.docs.map((d) => d.title)
      expect(titles).toContain('Post with Target')
      expect(titles).toContain('Post with Both')
    })

    it('should find documents matching all tags (AND query)', async () => {
      const tag1 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Required Tag 1' },
      })

      const tag2 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Required Tag 2' },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Has Both Tags',
          [`_h_${categoriesSlug}`]: [tag1.id, tag2.id],
        },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Has Only Tag 1',
          [`_h_${categoriesSlug}`]: [tag1.id],
        },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Has Only Tag 2',
          [`_h_${categoriesSlug}`]: [tag2.id],
        },
      })

      const results = await payload.find({
        collection: postSlug,
        where: {
          and: [
            { [`_h_${categoriesSlug}`]: { in: [tag1.id] } },
            { [`_h_${categoriesSlug}`]: { in: [tag2.id] } },
          ],
        },
      })

      expect(results.docs).toHaveLength(1)
      expect(results.docs[0]!.title).toBe('Has Both Tags')
    })

    it('should find documents matching any tag (OR query)', async () => {
      const tag1 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Option 1' },
      })

      const tag2 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Option 2' },
      })

      const tag3 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Option 3' },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Has Tag 1',
          [`_h_${categoriesSlug}`]: [tag1.id],
        },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Has Tag 2',
          [`_h_${categoriesSlug}`]: [tag2.id],
        },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Has Tag 3 Only',
          [`_h_${categoriesSlug}`]: [tag3.id],
        },
      })

      const results = await payload.find({
        collection: postSlug,
        where: {
          [`_h_${categoriesSlug}`]: { in: [tag1.id, tag2.id] },
        },
      })

      expect(results.docs).toHaveLength(2)
      const titles = results.docs.map((d) => d.title)
      expect(titles).toContain('Has Tag 1')
      expect(titles).toContain('Has Tag 2')
      expect(titles).not.toContain('Has Tag 3 Only')
    })

    it('should allow removing individual tags from document', async () => {
      const tag1 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Keep This' },
      })

      const tag2 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Remove This' },
      })

      const post = await payload.create({
        collection: postSlug,
        data: {
          title: 'Tagged Post',
          [`_h_${categoriesSlug}`]: [tag1.id, tag2.id],
        },
      })

      const updated = await payload.update({
        collection: postSlug,
        id: post.id,
        data: {
          [`_h_${categoriesSlug}`]: [tag1.id],
        },
      })

      expect(updated[`_h_${categoriesSlug}`]).toHaveLength(1)
      expect(updated[`_h_${categoriesSlug}`]).toContain(tag1.id)
      expect(updated[`_h_${categoriesSlug}`]).not.toContain(tag2.id)
    })

    it('should support nested tag hierarchies with multi-tag documents', async () => {
      const parentTag = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Parent Category' },
      })

      const childTag1 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Child Category 1', [`_h_${categoriesSlug}`]: parentTag.id },
      })

      const childTag2 = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Child Category 2', [`_h_${categoriesSlug}`]: parentTag.id },
      })

      const post = await payload.create({
        collection: postSlug,
        data: {
          title: 'Post with Nested Tags',
          [`_h_${categoriesSlug}`]: [childTag1.id, childTag2.id],
        },
      })

      const fetchedPost = await payload.findByID({
        collection: postSlug,
        id: post.id,
        depth: 1,
      })

      expect(fetchedPost[`_h_${categoriesSlug}`]).toHaveLength(2)

      const tagNames = fetchedPost[`_h_${categoriesSlug}`].map((t: any) => t.name)
      expect(tagNames).toContain('Child Category 1')
      expect(tagNames).toContain('Child Category 2')
    })

    it('should prevent circular references in tag hierarchy', async () => {
      const tag = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Self-ref Tag' },
      })

      await expect(
        payload.update({
          collection: categoriesSlug,
          id: tag.id,
          data: { [`_h_${categoriesSlug}`]: tag.id },
        }),
      ).rejects.toThrow()
    })

    it('should return related documents via findRelated endpoint for tags', async () => {
      const tag = await payload.create({
        collection: categoriesSlug,
        data: { name: 'Popular Tag' },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Tagged Post 1',
          [`_h_${categoriesSlug}`]: [tag.id],
        },
      })

      await payload.create({
        collection: postSlug,
        data: {
          title: 'Tagged Post 2',
          [`_h_${categoriesSlug}`]: [tag.id],
        },
      })

      const response = await restClient.GET(`/${categoriesSlug}/${tag.id}/related`)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result[postSlug]).toBeDefined()
      expect(result[postSlug].docs).toHaveLength(2)
    })

    it('should compute paths for tag hierarchy items', async () => {
      const rootTag = await payload.create({
        collection: categoriesSlug,
        context: { computeHierarchyPaths: true },
        data: { name: 'Technology' },
      })

      const childTag = await payload.create({
        collection: categoriesSlug,
        context: { computeHierarchyPaths: true },
        data: { name: 'JavaScript', [`_h_${categoriesSlug}`]: rootTag.id },
      })

      const grandchildTag = await payload.create({
        collection: categoriesSlug,
        context: { computeHierarchyPaths: true },
        data: { name: 'React', [`_h_${categoriesSlug}`]: childTag.id },
      })

      expect(grandchildTag._h_slugPath).toBe('technology/javascript/react')
      expect(grandchildTag._h_titlePath).toBe('Technology/JavaScript/React')
    })
  })
})
