import type { JsonObject, Payload } from 'payload'

import { schedulePublishHandler } from '@payloadcms/ui/utilities/schedulePublishHandler'
import path from 'path'
import { createLocalReq, saveVersion, ValidationError } from 'payload'
import { wait } from 'payload/shared'
import * as qs from 'qs-esm'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { AutosaveMultiSelectPost, DraftPost } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import {
  cleanupDocuments,
  cleanupGlobal,
  createDocumentWithManyVersions,
  createDraftDocument,
} from './helpers.js'
import {
  autosaveCollectionSlug,
  autoSaveGlobalSlug,
  autosaveWithMultiSelectCollectionSlug,
  draftCollectionSlug,
  draftGlobalSlug,
  draftUnlimitedGlobalSlug,
  localizedCollectionSlug,
  localizedGlobalSlug,
  versionCollectionSlug,
} from './slugs.js'

let payload: Payload
let restClient: NextRESTClient

const collectionGraphQLOriginalTitle = 'autosave title'

const globalGraphQLOriginalTitle = 'updated global title'
let globalLocalVersionID: number | string

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const formatGraphQLID = (id: number | string) =>
  payload.db.defaultIDType === 'number' ? id : `"${id}"`

describe('Versions', () => {
  let user: JsonObject

  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, restClient } = await initPayloadInt(dirname))

    const newUser = await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    user = {
      ...newUser,
      collection: 'users',
    }

    // sets token on rest client
    await restClient.login({
      slug: 'users',
      credentials: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    await payload.delete({
      collection: 'payload-jobs',
      where: {},
    })
  })

  describe('Collections - Local', () => {
    describe('Create', () => {
      it('should allow creating a draft with missing required field data', async () => {
        const draft = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            description: undefined,
            title: 'i have a title',
          },
          draft: true,
        })

        expect(draft.id).toBeDefined()
      })

      it('should allow a new version to be created and updated', async () => {
        const updatedTitle = 'Here is an updated post title in EN'

        // Create initial post
        const autosavePost = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            description: '345j23o4ifj34jf54g',
            title: 'Here is an autosave post in EN',
          },
        })

        // Update to create a version
        await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            title: updatedTitle,
          },
        })

        // Get versions
        const versions = await payload.findVersions({
          collection: autosaveCollectionSlug,
          where: {
            parent: {
              equals: autosavePost.id,
            },
          },
        })

        const updatedPost = await payload.findByID({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
        })
        expect(updatedPost.title).toBe(updatedTitle)
        expect(updatedPost._status).toStrictEqual('draft')
        expect(versions.docs[0].id).toBeDefined()
      })

      it('should allow saving multiple versions of models with unique fields', async () => {
        const autosavePost = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            description: 'description 1',
            title: 'unique unchanging title',
          },
        })

        await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            description: 'description 2',
          },
        })

        const finalDescription = 'final description'

        const secondUpdate = await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            description: finalDescription,
          },
        })

        expect(secondUpdate.description).toBe(finalDescription)
      })

      it('should allow a version to be retrieved by ID', async () => {
        // Create a post and update it to generate a version
        const autosavePost = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            description: 'test description',
            title: 'initial title',
          },
        })

        await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            title: 'updated title',
          },
        })

        // Get the version ID
        const versions = await payload.findVersions({
          collection: autosaveCollectionSlug,
          where: {
            parent: {
              equals: autosavePost.id,
            },
          },
        })

        const versionID = versions.docs[0].id

        // Retrieve version by ID
        const version = await payload.findVersionByID({
          id: versionID,
          collection: autosaveCollectionSlug,
        })

        expect(version.id).toStrictEqual(versionID)
      })

      it('should allow a version to save locales properly', async () => {
        const englishTitle = 'Title in EN'
        const spanishTitle = 'Title in ES'

        // Create initial post
        const autosavePost = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            description: 'test description',
            title: 'initial title',
          },
        })

        await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            title: englishTitle,
          },
        })

        const updatedPostES = await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            title: spanishTitle,
          },
          locale: 'es',
        })

        expect(updatedPostES.title).toBe(spanishTitle)

        const newEnglishTitle = 'New title in EN'

        await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            title: newEnglishTitle,
          },
        })

        const versions = await payload.findVersions({
          collection: autosaveCollectionSlug,
          locale: 'all',
          where: {
            parent: {
              equals: autosavePost.id,
            },
          },
        })

        expect(versions.docs[0].version.title.en).toStrictEqual(newEnglishTitle)
        expect(versions.docs[0].version.title.es).toStrictEqual(spanishTitle)
      })

      // https://github.com/payloadcms/payload/issues/4827
      it('should query drafts with relation', async () => {
        const draftPost = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'Description',
            title: 'Some Title',
          },
        })

        await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'Description',
            relation: draftPost.id,
            title: 'With Relation',
          },
        })

        const query = {
          collection: draftCollectionSlug,
          where: {
            relation: {
              equals: draftPost.id,
            },
          },
        }
        const all = await payload.find(query)
        const drafts = await payload.find({ ...query, draft: true })

        expect(all.docs).toHaveLength(1)
        expect(drafts.docs).toHaveLength(1)
      })

      it('should have different createdAt in a new version while the same version.createdAt', async () => {
        const doc = await payload.create({
          collection: autosaveCollectionSlug,
          data: { description: 'descr', title: 'title' },
        })

        await wait(10)

        const upd = await payload.update({
          id: doc.id,
          collection: autosaveCollectionSlug,
          data: {},
        })

        expect(upd.createdAt).toBe(doc.createdAt)

        const {
          docs: [latestVersionData],
        } = await payload.findVersions({
          collection: autosaveCollectionSlug,
          where: {
            and: [
              {
                latest: {
                  equals: true,
                },
                parent: {
                  equals: doc.id,
                },
              },
            ],
          },
        })

        // Version itself should have new createdAt
        expect(new Date(latestVersionData.createdAt) > new Date(doc.createdAt)).toBe(true)
        // But the same createdAt in version data!
        expect(latestVersionData.version.createdAt).toBe(doc.createdAt)

        const fromNonVersionsTable = await payload.findByID({
          id: doc.id,
          collection: autosaveCollectionSlug,
          draft: false,
        })

        // createdAt from non-versions should be the same as version_createdAt in versions
        expect(fromNonVersionsTable.createdAt).toBe(latestVersionData.version.createdAt)
        // When creating new version - updatedAt should match version.updatedAt
        expect(fromNonVersionsTable.updatedAt).toBe(latestVersionData.version.updatedAt)
      })

      it('should allow to create with a localized relationships inside a localized array and a block', async () => {
        const post = await payload.create({ collection: 'posts', data: {} })
        const res = await payload.create({
          collection: 'localized-posts',
          data: {
            blocks: [
              {
                array: [
                  {
                    relationship: post.id,
                  },
                ],
                blockType: 'block',
              },
            ],
          },
          depth: 0,
          draft: true,
        })
        expect(res.blocks[0]?.array[0]?.relationship).toEqual(post.id)
        const {
          docs: [resFromVersions],
        } = await payload.findVersions({
          collection: 'localized-posts',
          depth: 0,
          where: { parent: { equals: res.id } },
        })
        expect(resFromVersions?.version.blocks[0]?.array[0]?.relationship).toEqual(post.id)
      })

      it('should not create new versions with autosave:true', async () => {
        const post = await payload.create({
          collection: 'autosave-posts',
          data: { _status: 'draft', description: 'description', title: 'post' },
          draft: true,
        })

        await payload.update({
          id: post.id,
          autosave: true,
          collection: 'autosave-posts',
          data: { title: 'autosave' },
          draft: true,
        })

        const getVersionsCount = async () => {
          const { totalDocs: versionsCount } = await payload.countVersions({
            collection: 'autosave-posts',
            where: {
              parent: { equals: post.id },
            },
          })

          return versionsCount
        }

        expect(await getVersionsCount()).toBe(2)

        // id
        await payload.update({
          id: post.id,
          autosave: true,
          collection: 'autosave-posts',
          data: { title: 'post-updated-1' },
          draft: true,
        })

        expect(await getVersionsCount()).toBe(2)

        // where
        await payload.update({
          autosave: true,
          collection: 'autosave-posts',
          data: { title: 'post-updated-2' },
          draft: true,
          where: { id: { equals: post.id } },
        })
        expect(await getVersionsCount()).toBe(2)
      })

      it('should return null when saving a version with returning:false', async () => {
        const collection = autosaveCollectionSlug
        const collectionConfig = payload.collections[autosaveCollectionSlug].config

        const post = await payload.create({
          collection,
          data: { description: 'description' },
          draft: true,
        })

        const result = await saveVersion({
          id: post.id,
          collection: collectionConfig,
          docWithLocales: post,
          operation: 'create',
          payload,
          returning: false,
        })

        expect(result).toBeNull()
      })
    })

    describe('Duplicate', () => {
      it('should duplicate a versioned document as a draft', async () => {
        const originalDoc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'Original description',
            title: 'Original Title',
            _status: 'published',
          },
          draft: false,
        })

        const duplicatedDoc = await payload.create({
          duplicateFromID: originalDoc.id,
          collection: draftCollectionSlug,
          data: {
            _status: 'draft',
          },
          draft: true,
        })

        expect(duplicatedDoc._status).toBe('draft')
      })
    })

    describe('Query operations', () => {
      beforeAll(async () => {
        // Create test data for query-only tests (pagination, sorting)

        // Create a document with many versions for pagination testing
        await createDocumentWithManyVersions({
          collection: draftCollectionSlug,
          draft: true,
          initialData: {
            description: 'Description',
            radio: 'test',
            title: 'Title With Many Versions',
          },
          payload,
          updateField: 'title',
          updateValue: (i) => `Title With Many Versions ${i + 1}`,
          versionCount: 11,
        })

        // Create multiple drafts for sort testing
        await createDraftDocument({
          collection: draftCollectionSlug,
          payload,
          title: 'AAA First Draft',
        })

        await createDraftDocument({
          collection: draftCollectionSlug,
          payload,
          title: 'ZZZ Last Draft',
        })

        await createDraftDocument({
          collection: draftCollectionSlug,
          payload,
          title: 'MMM Middle Draft',
        })
      })

      it('should paginate versions', async () => {
        const versions = await payload.findVersions({
          collection: draftCollectionSlug,
          limit: 5,
        })
        const versionsPage2 = await payload.findVersions({
          collection: draftCollectionSlug,
          limit: 5,
          page: 2,
        })

        expect(versions.docs).toHaveLength(5)
        expect(versions.page).toBe(1)
        expect(versionsPage2.docs).toHaveLength(5)
        expect(versionsPage2.page).toBe(2)

        expect(versions.docs[0]!.id).not.toBe(versionsPage2.docs[0]!.id)
      })

      it('should query drafts with sort', async () => {
        const draftsAscending = await payload.find({
          collection: draftCollectionSlug,
          draft: true,
          sort: 'title',
        })

        const draftsDescending = await payload.find({
          collection: draftCollectionSlug,
          draft: true,
          sort: '-title',
        })

        expect(draftsAscending).toBeDefined()
        expect(draftsDescending).toBeDefined()
        expect(draftsAscending.docs[0]).toMatchObject(
          draftsDescending.docs[draftsDescending.docs.length - 1]!,
        )
      })

      it('should `findVersions` with sort', async () => {
        const draftsAscending = await payload.findVersions({
          collection: draftCollectionSlug,
          draft: true,
          limit: 100,
          sort: 'createdAt',
        })

        const draftsDescending = await payload.findVersions({
          collection: draftCollectionSlug,
          draft: true,
          limit: 100,
          sort: '-createdAt',
        })

        expect(draftsAscending).toBeDefined()
        expect(draftsDescending).toBeDefined()
        expect(draftsAscending.docs[0]).toMatchObject(
          draftsDescending.docs[draftsDescending.docs.length - 1]!,
        )
      })

      it('should findVersions with limit: 0', async () => {
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: { description: 'a', title: 'test-doc' },
        })

        for (let i = 0; i < 100; i++) {
          await payload.update({ collection: draftCollectionSlug, id: doc.id, data: {} })
        }
        const res = await payload.findVersions({
          collection: draftCollectionSlug,
          limit: 0,
          where: { parent: { equals: doc.id } },
        })
        expect(res.docs).toHaveLength(101)
      })
    })

    describe('Restore', () => {
      afterEach(async () => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug],
          payload,
        })
      })

      it('should return `findVersions` in correct order', async () => {
        const somePost = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'description 1',
            title: 'first post',
          },
        })

        const updatedPost = await payload.update({
          id: somePost.id,
          collection: draftCollectionSlug,
          data: {
            title: 'This should be the latest version',
          },
        })

        const versions = await payload.findVersions({
          collection: draftCollectionSlug,
          where: {
            parent: { equals: somePost.id },
          },
        })

        expect(versions.docs[0]!.version.title).toBe(updatedPost.title)
      })
      it('should allow a version to be restored', async () => {
        const title2 = 'Another updated post title in EN'
        const updated = 'updated'

        const versionedPost = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'version description',
            title: 'version title',
          },
          draft: true,
        })

        let updatedPost = await payload.update({
          id: versionedPost.id,
          collection: draftCollectionSlug,
          data: {
            blocksField: [
              {
                blockType: 'block',
                localized: 'text',
                text: 'text',
              },
            ],
            title: title2,
          },
          draft: true,
        })

        updatedPost = await payload.update({
          id: versionedPost.id,
          collection: draftCollectionSlug,
          data: {
            blocksField: [
              {
                id: updatedPost.blocksField?.[0]!.id,
                blockName: 'breakpoint',
                blockType: 'block',
                localized: updated,
                text: updated,
              },
            ],
            title: title2,
          },
          draft: true,
        })

        expect(updatedPost.title).toBe(title2)
        expect(updatedPost.blocksField?.[0]!.text).toBe(updated)
        expect(updatedPost.blocksField?.[0]!.localized).toBe(updated)

        // Make sure it was updated correctly
        const draftFromUpdatedPost = await payload.findByID({
          id: versionedPost.id,
          collection: draftCollectionSlug,
          draft: true,
        })
        expect(draftFromUpdatedPost.title).toBe(title2)
        expect(draftFromUpdatedPost.blocksField).toHaveLength(1)
        expect(draftFromUpdatedPost.blocksField?.[0]!.localized).toStrictEqual(updated)

        const versions = await payload.findVersions({
          collection: draftCollectionSlug,
          where: {
            parent: {
              equals: versionedPost.id,
            },
          },
        })

        const versionToRestore = versions.docs[versions.docs.length - 1]
        // restore to previous version
        const restoredVersion = await payload.restoreVersion({
          id: versionToRestore!.id,
          collection: draftCollectionSlug,
        })

        expect({ ...restoredVersion }).toMatchObject({
          ...versionToRestore!.version,
          updatedAt: restoredVersion.updatedAt,
        })

        const latestDraft = await payload.findByID({
          id: versionedPost.id,
          collection: draftCollectionSlug,
          draft: true,
        })

        expect(latestDraft).toMatchObject({
          ...versionToRestore!.version,
          // timestamps cannot be guaranteed to be the exact same to the milliseconds
          createdAt: latestDraft.createdAt,
          updatedAt: latestDraft.updatedAt,
        })
        expect(latestDraft.blocksField).toHaveLength(0)
      })
    })

    it('should restore published version with correct data', async () => {
      // create a post
      const originalPost = await payload.create({
        collection: draftCollectionSlug,
        data: {
          _status: 'published',
          description: 'description',
          title: 'v1',
        },
      })

      // update the post
      await payload.update({
        id: originalPost.id,
        collection: draftCollectionSlug,
        data: {
          _status: 'published',
          title: 'v2',
        },
        draft: true,
      })

      // get the version id of the original draft
      const versions = await payload.findVersions({
        collection: draftCollectionSlug,
        where: {
          parent: {
            equals: originalPost.id,
          },
        },
      })

      // restore the version
      const versionToRestore = versions.docs[versions.docs.length - 1]
      const restoredVersion = await payload.restoreVersion({
        id: versionToRestore!.id,
        collection: draftCollectionSlug,
      })

      // get the latest draft
      const latestDraft = await payload.findByID({
        id: originalPost.id,
        collection: draftCollectionSlug,
        draft: true,
      })

      // assert it has the original post content
      expect(latestDraft.title).toStrictEqual('v1')
      expect(restoredVersion.title).toStrictEqual('v1')
    })

    it('findVersions - pagination should work correctly', async () => {
      const post = await payload.create({
        collection: draftCollectionSlug,
        data: { description: 'a', title: 'title' },
      })
      for (let i = 0; i < 100; i++) {
        await payload.update({ id: post.id, collection: draftCollectionSlug, data: {} })
      }
      const res = await payload.findVersions({
        collection: draftCollectionSlug,
        where: { parent: { equals: post.id } },
      })
      expect(res.totalDocs).toBe(101)
      expect(res.docs).toHaveLength(10)
      const resPaginationFalse = await payload.findVersions({
        collection: draftCollectionSlug,
        pagination: false,
        where: { parent: { equals: post.id } },
      })

      expect(resPaginationFalse.docs).toHaveLength(101)
      expect(resPaginationFalse.totalDocs).toBe(101)

      const resPaginationFalseLimit0 = await payload.findVersions({
        collection: draftCollectionSlug,
        limit: 0,
        pagination: false,
        where: { parent: { equals: post.id } },
      })
      expect(resPaginationFalseLimit0.docs).toHaveLength(101)
      expect(resPaginationFalseLimit0.totalDocs).toBe(101)
    })

    describe('Update', () => {
      afterEach(async () => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug, autosaveCollectionSlug],
          payload,
        })
      })

      it('should allow a draft to be patched', async () => {
        const originalTitle = 'Here is a published post'

        const originalPublishedPost = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            _status: 'published',
            description: 'kjnjyhbbdsfseankuhsjsfghb',
            title: originalTitle,
          },
        })

        const patchedTitle = 'Here is a draft post with a patched title'

        await payload.update({
          id: originalPublishedPost.id,
          collection: autosaveCollectionSlug,
          data: {
            _status: 'draft',
            title: patchedTitle,
          },
          draft: true,
          locale: 'en',
        })

        const spanishTitle = 'es title'

        // second update to existing draft
        await payload.update({
          id: originalPublishedPost.id,
          collection: autosaveCollectionSlug,
          data: {
            _status: 'draft',
            title: spanishTitle,
          },
          draft: true,
          locale: 'es',
        })

        const publishedPost = await payload.findByID({
          id: originalPublishedPost.id,
          collection: autosaveCollectionSlug,
        })

        const draftPost = await payload.findByID({
          id: originalPublishedPost.id,
          collection: autosaveCollectionSlug,
          draft: true,
          locale: 'all',
        })

        expect(publishedPost.title).toBe(originalTitle)
        expect(draftPost.title.en).toBe(patchedTitle)
        expect(draftPost.title.es).toBe(spanishTitle)
      })

      it('should have correct updatedAt timestamps when saving drafts', async () => {
        const created = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'desc',
            title: 'title',
          },
          draft: true,
        })

        await wait(10)

        const updated = await payload.update({
          id: created.id,
          collection: draftCollectionSlug,
          data: {
            title: 'updated title',
          },
          draft: true,
        })

        const createdUpdatedAt = new Date(created.updatedAt)
        const updatedUpdatedAt = new Date(updated.updatedAt)

        expect(Number(updatedUpdatedAt)).toBeGreaterThan(Number(createdUpdatedAt))
      })

      it('should have correct updatedAt timestamps when saving drafts with autosave', async () => {
        const created = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'desc',
            title: 'title',
          },
          draft: true,
        })

        await wait(10)

        const updated = await payload.update({
          id: created.id,
          autosave: true,
          collection: draftCollectionSlug,
          data: {
            title: 'updated title',
          },
          draft: true,
        })

        const createdUpdatedAt = new Date(created.updatedAt)
        const updatedUpdatedAt = new Date(updated.updatedAt)

        expect(Number(updatedUpdatedAt)).toBeGreaterThan(Number(createdUpdatedAt))
      })

      it('should update correct version at doc that has hasMany field when saving with autosave', async () => {
        const firstDocTag: AutosaveMultiSelectPost['tag'] = ['blog', 'essay']
        const doc = await payload.create({
          collection: autosaveWithMultiSelectCollectionSlug,
          data: {
            _status: 'published',
            tag: firstDocTag,
            title: 'title 1',
          },
          draft: false,
        })
        await payload.update({
          id: doc.id,
          autosave: true,
          collection: autosaveWithMultiSelectCollectionSlug,
          data: {
            tag: firstDocTag,
            title: 'title 2',
          },
          draft: true,
        })

        const doc2 = await payload.create({
          collection: autosaveWithMultiSelectCollectionSlug,
          data: {
            _status: 'published',
            tag: ['blog'],
            title: 'title 1-2',
          },
          draft: false,
        })

        await payload.update({
          id: doc2.id,
          autosave: true,
          collection: autosaveWithMultiSelectCollectionSlug,
          data: {
            tag: ['blog'],
            title: 'title 2-2',
          },
          draft: true,
        })
        await payload.update({
          id: doc2.id,
          autosave: true,
          collection: autosaveWithMultiSelectCollectionSlug,
          data: {
            tag: ['blog'],
            title: 'title 3-2',
          },
          draft: true,
        })

        const lastDocVersion = await payload.findVersions({
          collection: autosaveWithMultiSelectCollectionSlug,
          limit: 1,
          where: {
            parent: {
              equals: doc.id,
            },
          },
        })
        expect(lastDocVersion.docs[0]?.version.tag).toEqual(firstDocTag)

        await cleanupDocuments({
          collectionSlugs: [autosaveWithMultiSelectCollectionSlug],
          payload,
        })
      })

      it('should validate when publishing with the draft arg', async () => {
        // no title (not valid for publishing)
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'desc',
          },
          draft: true,
        })

        await expect(
          payload.update({
            id: doc.id,
            collection: draftCollectionSlug,
            data: { _status: 'published' },
            draft: true,
          }),
        ).rejects.toThrow(ValidationError)

        // succeeds but returns zero docs updated, with an error
        const updateManyResult = await payload.update({
          collection: draftCollectionSlug,
          data: { _status: 'published' },
          draft: true,
          where: {
            id: { equals: doc.id },
          },
        })

        expect(updateManyResult.docs).toHaveLength(0)
        expect(updateManyResult.errors).toStrictEqual([
          { id: doc.id, message: 'The following field is invalid: Group > Title', isPublic: true },
        ])
      })

      it('should update with autosave: true', async () => {
        // Save a draft
        const { id } = await payload.create({
          collection: autosaveCollectionSlug,
          data: { _status: 'draft', description: 'some-description', title: 'my-title' },
          draft: true,
        })

        // Autosave the same draft, calls db.updateVersion
        const updated1 = await payload.update({
          id,
          autosave: true,
          collection: autosaveCollectionSlug,
          data: {
            title: 'new-title',
          },
          draft: true,
        })

        const versionsCount = await payload.countVersions({
          collection: autosaveCollectionSlug,
          where: {
            parent: {
              equals: id,
            },
          },
        })

        // This should not create a new version
        const updated2 = await payload.update({
          id,
          autosave: true,
          collection: autosaveCollectionSlug,
          data: {
            title: 'new-title-2',
          },
          draft: true,
        })

        const versionsCountAfter = await payload.countVersions({
          collection: autosaveCollectionSlug,
          where: {
            parent: {
              equals: id,
            },
          },
        })

        expect(versionsCount.totalDocs).toBe(versionsCountAfter.totalDocs)
        expect(updated1.id).toBe(id)
        expect(updated1.title).toBe('new-title')

        expect(updated2.id).toBe(id)
        expect(updated2.title).toBe('new-title-2')

        await cleanupDocuments({
          collectionSlugs: [autosaveCollectionSlug],
          payload,
        })
      })
    })

    describe('Update Many', () => {
      afterEach(async () => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug],
          payload,
        })
      })

      it('should update many using drafts', async () => {
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'published',
            description: 'description to bulk update',
            title: 'initial value',
          },
        })

        await payload.update({
          id: doc.id,
          collection: draftCollectionSlug,
          data: {
            title: 'updated title',
          },
          draft: true,
        })

        // bulk publish
        const updated = await payload.update({
          collection: draftCollectionSlug,
          data: {
            _status: 'published',
            description: 'updated description',
          },
          draft: true,
          where: {
            id: {
              in: [doc.id],
            },
          },
        })

        const updatedDoc = updated.docs?.[0]

        // get the published doc
        const findResult = await payload.find({
          collection: draftCollectionSlug,
          where: {
            id: { equals: doc.id },
          },
        })

        const findDoc = findResult.docs?.[0]

        expect(updatedDoc.description).toStrictEqual('updated description')
        expect(updatedDoc.title).toStrictEqual('updated title')
        expect(findDoc.title).toStrictEqual('updated title')
        expect(findDoc.description).toStrictEqual('updated description')
      })
    })

    describe('Delete', () => {
      it('should delete drafts', async () => {
        const postToDelete = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            _status: 'draft',
            description: 'description',
            title: 'title to delete',
          },
        })

        const drafts = await payload.db.queryDrafts({
          collection: autosaveCollectionSlug,
          where: {
            parent: {
              equals: postToDelete.id,
            },
          },
        })

        await payload.delete({
          collection: autosaveCollectionSlug,
          where: {
            id: { equals: postToDelete.id },
          },
        })

        const result = await payload.db.queryDrafts({
          collection: autosaveCollectionSlug,
          where: {
            parent: {
              in: drafts.docs.map(({ id }) => id),
            },
            // appendVersionToQueryKey,
          },
        })

        expect(result.docs).toHaveLength(0)

        await cleanupDocuments({
          collectionSlugs: [autosaveCollectionSlug],
          payload,
        })
      })
    })

    describe('Draft Count', () => {
      afterEach(async () => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug],
          payload,
        })
      })

      it('creates proper number of drafts', async () => {
        const originalDraft = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'draft',
            description: 'A',
            title: 'A',
          },
          draft: true,
        })

        await payload.update({
          id: originalDraft.id,
          collection: draftCollectionSlug,
          data: {
            _status: 'draft',
            description: 'B',
            title: 'B',
          },
          draft: true,
        })

        await payload.update({
          id: originalDraft.id,
          collection: draftCollectionSlug,
          data: {
            _status: 'draft',
            description: 'C',
            title: 'C',
          },
          draft: true,
        })

        const mostRecentDraft = await payload.findByID({
          id: originalDraft.id,
          collection: draftCollectionSlug,
          draft: true,
        })

        expect(mostRecentDraft.title).toStrictEqual('C')

        const versions = await payload.findVersions({
          collection: draftCollectionSlug,
          where: {
            parent: {
              equals: originalDraft.id,
            },
          },
        })

        expect(versions.docs).toHaveLength(3)
      })
    })

    describe('Draft Types', () => {
      afterEach(async () => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug],
          payload,
        })
      })

      it('should allow creating drafts without required fields', async () => {
        // This test validates that when draft: true is set, required fields become optional
        // TypeScript should not complain about missing 'description' field even though it's required
        const draft = await payload.create({
          collection: draftCollectionSlug,
          data: {
            title: 'Draft without description',
            // description is required but omitted - should work with draft: true
          },
          draft: true,
        })

        expect(draft.title).toBe('Draft without description')
        // Different databases return null vs undefined for missing fields
        expect(draft.description).toBeFalsy()
        expect(draft._status).toBe('draft')
      })

      it('should require all required fields when draft is false', async () => {
        // This validates that required fields are still enforced when draft is false
        await expect(
          // @ts-expect-error - description is required when not creating a draft
          payload.create({
            collection: draftCollectionSlug,
            data: {
              title: 'Published without description',
            },
            draft: false,
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('should require all required fields when draft is not specified', async () => {
        // This validates that required fields are still enforced when draft option is omitted
        await expect(
          // @ts-expect-error - description is required when draft option is not specified
          payload.create({
            collection: draftCollectionSlug,
            data: {
              title: 'Post without description',
            },
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('should allow all fields to be optional with draft: true', async () => {
        // Test that even fields nested in groups can be omitted
        const draft = await payload.create({
          collection: draftCollectionSlug,
          data: {
            // Both title and description are required but omitted
          },
          draft: true,
        })

        expect(draft._status).toBe('draft')
        // Different databases return null vs undefined for missing fields
        expect(draft.title).toBeFalsy()
        expect(draft.description).toBeFalsy()
      })
    })

    describe('Max Versions', () => {
      // create 2 documents with 3 versions each
      // expect 2 documents with 2 versions each
      it('retains correct versions', async () => {
        // doc1 - v1
        const doc1 = await payload.create({
          collection: versionCollectionSlug,
          data: {
            description: 'A',
            title: 'A',
          },
        })
        // v2
        await payload.update({
          id: doc1.id,
          collection: versionCollectionSlug,
          data: {
            description: 'B',
            title: 'B',
          },
        })
        // v3
        await payload.update({
          id: doc1.id,
          collection: versionCollectionSlug,
          data: {
            description: 'C',
            title: 'C',
          },
        })

        // doc2 - v1
        const doc2 = await payload.create({
          collection: versionCollectionSlug,
          data: {
            description: 'D',
            title: 'D',
          },
        })
        // v2
        await payload.update({
          id: doc2.id,
          collection: versionCollectionSlug,
          data: {
            description: 'E',
            title: 'E',
          },
        })
        // v3
        await payload.update({
          id: doc2.id,
          collection: versionCollectionSlug,
          data: {
            description: 'F',
            title: 'F',
          },
        })

        const doc1Versions = await payload.findVersions({
          collection: versionCollectionSlug,
          sort: '-updatedAt',
          where: {
            parent: {
              equals: doc1.id,
            },
          },
        })

        const doc2Versions = await payload.findVersions({
          collection: versionCollectionSlug,
          sort: '-updatedAt',
          where: {
            parent: {
              equals: doc2.id,
            },
          },
        })

        // correctly retains 2 documents in the versions collection
        expect(doc1Versions.totalDocs).toStrictEqual(2)
        // correctly retains the most recent 2 versions
        expect(doc1Versions.docs[1].version.title).toStrictEqual('B')

        // correctly retains 2 documents in the versions collection
        expect(doc2Versions.totalDocs).toStrictEqual(2)
        // correctly retains the most recent 2 versions
        expect(doc2Versions.docs[1].version.title).toStrictEqual('E')

        const docs = await payload.find({
          collection: versionCollectionSlug,
        })

        // correctly retains 2 documents in the actual collection
        expect(docs.totalDocs).toStrictEqual(2)

        await cleanupDocuments({
          collectionSlugs: [versionCollectionSlug],
          payload,
        })
      })
    })

    describe('Race conditions', () => {
      it('should keep latest true with parallel writes', async () => {
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'A',
            title: 'A',
          },
        })

        const writeAmount = 100

        const promises = Array.from({ length: writeAmount }, async (_, i) => {
          return new Promise((resolve) => {
            // Add latency so updates aren't immediate after each other but still in parallel
            setTimeout(() => {
              payload
                .update({
                  id: doc.id,
                  collection: draftCollectionSlug,
                  data: {},
                  draft: true,
                })
                .then(resolve)
                .catch(resolve)
            }, i * 5)
          })
        })

        await Promise.all(promises)

        const { docs } = await payload.findVersions({
          collection: draftCollectionSlug,
          where: {
            and: [
              {
                parent: {
                  equals: doc.id,
                },
              },
              {
                latest: {
                  equals: true,
                },
              },
            ],
          },
        })

        expect(docs[0]).toBeDefined()

        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug],
          payload,
        })
      })
    })
  })

  describe('Querying', () => {
    const originalTitle = 'original title'
    const updatedTitle1 = 'new title 1'
    const updatedTitle2 = 'new title 2'
    let firstDraft

    async function createPostWithVersions(args?: { title?: string }) {
      firstDraft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'my description',
          radio: 'test',
          title: args?.title || originalTitle,
        },
      })

      // This will be created in the `_draft-posts_versions` collection
      await payload.update({
        id: firstDraft.id,
        collection: draftCollectionSlug,
        data: {
          title: updatedTitle1,
        },
        draft: true,
      })

      // This will be created in the `_draft-posts_versions` collection
      // and will be the newest draft, able to be queried on
      await payload.update({
        id: firstDraft.id,
        collection: draftCollectionSlug,
        data: {
          title: updatedTitle2,
        },
        draft: true,
      })
    }

    beforeEach(async () => {
      await createPostWithVersions()
    })

    afterEach(async () => {
      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug],
        payload,
      })
    })

    it('should allow querying a draft doc from main collection', async () => {
      const findResults = await payload.find({
        collection: draftCollectionSlug,
        where: {
          title: {
            equals: originalTitle,
          },
        },
      })

      expect(findResults.docs[0].title).toStrictEqual(originalTitle)
    })

    it('should return more than 10 `totalDocs`', async () => {
      const { id } = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'Description',
          title: 'Title',
        },
      })

      const createVersions = async (int: number = 1) => {
        for (let i = 0; i < int; i++) {
          await payload.update({
            id,
            collection: draftCollectionSlug,
            data: {
              title: `Title ${i}`,
            },
          })
        }
      }

      await createVersions(10)

      const findResults = await payload.findVersions({
        collection: draftCollectionSlug,
        where: {
          parent: {
            equals: id,
          },
        },
      })

      expect(findResults.totalDocs).toBe(11)

      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug],
        payload,
      })
    })

    it('should not be able to query an old draft version with draft=true', async () => {
      const draftFindResults = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        where: {
          title: {
            equals: updatedTitle1,
          },
        },
      })

      expect(draftFindResults.docs).toHaveLength(0)
    })

    it('should be able to query the newest draft version with draft=true', async () => {
      const draftFindResults = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        where: {
          title: {
            equals: updatedTitle2,
          },
        },
      })

      expect(draftFindResults.docs[0].title).toStrictEqual(updatedTitle2)
    })

    it("should not be able to query old drafts that don't match with draft=true", async () => {
      const draftFindResults = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        where: {
          title: {
            equals: originalTitle,
          },
        },
      })

      expect(draftFindResults.docs).toHaveLength(0)
    })

    it('should be able to query by id with draft=true', async () => {
      await createPostWithVersions({ title: 'different document' })
      const allDocs = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
      })

      expect(allDocs.docs).toHaveLength(2)

      const byID = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        where: {
          id: {
            equals: firstDraft.id,
          },
        },
      })

      expect(byID.docs).toHaveLength(1)
    })

    it('should be able to query by id AND any other field with draft=true', async () => {
      await createPostWithVersions({ title: 'title document 2' })
      const allDocs = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        where: {
          title: {
            like: 'title',
          },
        },
      })

      expect(allDocs.docs).toHaveLength(2)

      const results = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        where: {
          and: [
            {
              id: {
                not_in: allDocs.docs[0].id,
              },
            },
            {
              title: {
                like: 'title',
              },
            },
          ],
        },
      })

      expect(results.docs).toHaveLength(1)
    })
  })

  describe('Collections - GraphQL', () => {
    async function createAutoSavePostHelper({
      description,
      title,
    }: {
      description: string
      title: string
    }): Promise<JsonObject> {
      const query = `mutation {
          createAutosavePost(data: {title: "${title}", description: "${description}"}) {
          id
          title
          description
          createdAt
          updatedAt
          _status
        }
      }`

      const result: JsonObject = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      return result.data.createAutosavePost
    }

    async function updateAutoSavePostHelper({
      id,
      title,
    }: {
      id: number | string
      title: string
    }): Promise<JsonObject> {
      const query = `mutation {
          updateAutosavePost(id: ${formatGraphQLID(id)}, data: {title: "${title}"}) {
          id
          title
          description
          createdAt
          updatedAt
          _status
        }
      }`

      const result: JsonObject = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      return result.data.updateAutosavePost
    }

    async function getVersionByIDHelper({ id }: { id: number | string }): Promise<JsonObject> {
      const query = `query {
          versionAutosavePost(id: ${formatGraphQLID(id)}) {
          id
          createdAt
          updatedAt
          parent {
            id
          }
          version {
            title
          }
        }
      }`

      const result: JsonObject = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      return result.data.versionAutosavePost
    }

    async function getLatestVersionByParentIDHelper({
      parentID,
    }: {
      parentID: number | string
    }): Promise<JsonObject> {
      const query = `query {
          versionsAutosavePosts(where: { AND: [{ parent: { equals: ${formatGraphQLID(parentID)} } }, { latest: { equals: true } }] }) {
            docs {
              id
              parent {
                id
              }
              version {
                title
              }
            }
          }
        }`

      const result: JsonObject = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      return result.data.versionsAutosavePosts.docs[0]
    }

    async function getVersionsAutosaveHelper({ where }: { where: string }): Promise<JsonObject> {
      const query = `query {
          versionsAutosavePost(where: ${where}) {
          id
          title
          description
          createdAt
          updatedAt
          _status
        }
      }`

      const result: JsonObject = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      return result.data.versionsAutosavePost
    }

    describe('Create', () => {
      it('should allow a new doc to be created with draft status', async () => {
        const autosavePost = await createAutoSavePostHelper({
          description: 'other autosave description 2',
          title: 'Some other title 2',
        })

        expect(autosavePost._status).toStrictEqual('draft')
      })
    })

    describe('Read', () => {
      const updatedTitle2 = 'updated title'
      let localPostID: number | string

      beforeAll(async () => {
        const post = await createAutoSavePostHelper({
          description: 'local autosave description',
          title: collectionGraphQLOriginalTitle,
        })
        localPostID = post.id
      })

      afterAll(async () => {
        await cleanupDocuments({
          collectionSlugs: [autosaveCollectionSlug],
          payload,
        })
      })

      it('should allow read of versions by version id', async () => {
        await updateAutoSavePostHelper({
          id: localPostID,
          title: updatedTitle2,
        })
        const latestVersion = await getLatestVersionByParentIDHelper({
          parentID: localPostID,
        })
        const versionPost = await getVersionByIDHelper({
          id: latestVersion.id,
        })

        expect(versionPost.id).toBeDefined()
        expect(versionPost.parent.id).toStrictEqual(localPostID)
        expect(versionPost.version.title).toStrictEqual(updatedTitle2)
      })

      it('should allow read of versions by querying version content', async () => {
        // language=graphQL
        const query = `query {
          versionsAutosavePosts(where: { version__title: {equals: "${collectionGraphQLOriginalTitle}" } }) {
            docs {
              id
              parent {
                id
              }
              version {
                title
              }
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
          })
          .then((res) => res.json())

        const doc = data.versionsAutosavePosts.docs[0]

        expect(doc.id).toBeDefined()
        expect(doc.parent.id).toStrictEqual(localPostID)
        expect(doc.version.title).toStrictEqual(collectionGraphQLOriginalTitle)
      })
    })

    describe('Restore', () => {
      let postID: number | string
      let versionID: number | string
      beforeAll(async () => {
        const autosavePost = await createAutoSavePostHelper({
          description: 'autosave description for restore',
          title: collectionGraphQLOriginalTitle,
        })
        postID = autosavePost.id
      })

      beforeEach(async () => {
        // modify the post to create a new version
        // language=graphQL
        const update = `mutation {
          updateAutosavePost(id: ${formatGraphQLID(
            postID,
          )}, data: {title: "${collectionGraphQLOriginalTitle}"}) {
            title
            updatedAt
            createdAt
          }
        }`
        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: update }),
        })

        // language=graphQL
        const query = `query {
          versionsAutosavePosts(where: { parent: { equals: ${formatGraphQLID(postID)} } }) {
            docs {
              id
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
          })
          .then((res) => res.json())

        versionID = data.versionsAutosavePosts.docs[0].id
      })

      afterAll(async () => {
        await cleanupDocuments({
          collectionSlugs: [autosaveCollectionSlug],
          payload,
        })
      })

      it('should allow a version to be restored', async () => {
        // Update it
        const update = `mutation {
          updateAutosavePost(id: ${formatGraphQLID(postID)}, data: {title: "${'Wrong title'}"}) {
            title
            updatedAt
            createdAt
          }
        }`
        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: update }),
        })

        // restore a versionsPost
        const restore = `mutation {
          restoreVersionAutosavePost(id: ${formatGraphQLID(versionID)}) {
            title
          }
        }`

        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: restore }),
        })

        const query = `query {
          AutosavePost(id: ${formatGraphQLID(postID)}) {
            title
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
          })
          .then((res) => res.json())

        expect(data.AutosavePost.title).toStrictEqual(collectionGraphQLOriginalTitle)
      })
    })
  })

  describe('Collections - REST', () => {
    it('sholud query versions', async () => {
      // Create a post and update it to generate a version
      const autosavePost = await payload.create({
        collection: autosaveCollectionSlug,
        data: {
          description: 'test description',
          title: 'initial title',
        },
      })

      await payload.update({
        id: autosavePost.id,
        collection: autosaveCollectionSlug,
        data: {
          title: 'updated title',
        },
      })

      const response = await restClient.GET(`/${autosaveCollectionSlug}/versions`)
      expect(response.status).toBe(200)
      const json = await response.json()

      // Find the version for our post
      const ourVersion = json.docs.find((doc) => doc.parent === autosavePost.id)
      expect(ourVersion).toBeDefined()
      expect(ourVersion.parent).toBe(autosavePost.id)

      const responseByID = await restClient.GET(
        `/${autosaveCollectionSlug}/versions/${ourVersion.id}`,
      )
      expect(responseByID.status).toBe(200)
      const jsonByID = await responseByID.json()
      expect(jsonByID.parent).toBe(autosavePost.id)
    })

    it('should allow query by latest', async () => {
      async function createVersion({ title }: { title: string }) {
        return payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'Test Description',
            title,
          },
        })
      }

      async function updateVersion({
        id,
        data,
      }: {
        data: Partial<DraftPost>
        id: number | string
      }) {
        return payload.update({
          id,
          collection: draftCollectionSlug,
          data,
        })
      }

      const version1 = await createVersion({
        title: 'test1',
      })

      await updateVersion({
        id: version1.id,
        data: {
          title: 'test1 updated',
        },
      })

      const newestVersion = await updateVersion({
        id: version1.id,
        data: {
          title: 'test2 updated',
        },
      })

      const query = qs.stringify(
        {
          where: {
            and: [
              {
                latest: {
                  equals: true,
                },
              },
              {
                parent: {
                  equals: version1.id,
                },
              },
            ],
          },
        },
        {
          addQueryPrefix: true,
        },
      )

      const response = await restClient.GET(`/${draftCollectionSlug}/versions${query}`)
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.docs).toHaveLength(1)

      expect(json.docs[0].version.title).toBe(newestVersion.title)
    })
  })

  describe('Globals - Local', () => {
    let globalVersionID: number | string
    beforeEach(async () => {
      const title2 = 'Here is an updated global title in EN'
      await payload.updateGlobal({
        slug: autoSaveGlobalSlug,
        data: {
          title: 'Test Global',
        },
      })

      await payload.updateGlobal({
        slug: autoSaveGlobalSlug,
        data: {
          title: title2,
        },
      })

      const versions = await payload.findGlobalVersions({
        slug: autoSaveGlobalSlug,
      })

      globalVersionID = versions.docs[0]!.id
    })
    describe('Create', () => {
      it('should allow a new version to be created', async () => {
        const title2 = 'Here is an updated global title in EN'
        const updatedGlobal = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
        })
        expect(updatedGlobal.title).toBe(title2)
        expect(updatedGlobal._status).toStrictEqual('draft')
        expect(globalVersionID).toBeDefined()
      })

      it('ensure global can be published after saving draft', async () => {
        const draftVersion = await payload.updateGlobal({
          slug: 'max-versions',
          data: {
            _status: 'draft',
            title: 'Draft',
          },
          draft: true,
        })
        expect(draftVersion.title).toStrictEqual('Draft')
        expect(draftVersion._status).toStrictEqual('draft')

        const publishedVersion = await payload.updateGlobal({
          slug: 'max-versions',
          data: {
            _status: 'published',
            title: 'Published',
          },
          draft: false,
        })
        expect(publishedVersion.title).toStrictEqual('Published')
        expect(publishedVersion._status).toStrictEqual('published')
      })

      it('should have different createdAt in a new version while the same version.createdAt', async () => {
        const doc = await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: { title: 'asd' },
        })

        await wait(10)

        const upd = await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: { title: 'asd2' },
        })

        expect(upd.createdAt).toBe(doc.createdAt)

        const {
          docs: [latestVersionData],
        } = await payload.findGlobalVersions({
          slug: autoSaveGlobalSlug,
          where: {
            latest: {
              equals: true,
            },
          },
        })

        // Version itself should have new createdAt
        expect(new Date(latestVersionData.createdAt) > new Date(doc.createdAt)).toBe(true)
        // But the same version.createdAt!
        expect(latestVersionData.version.createdAt).toBe(doc.createdAt)

        const fromNonVersionsTable = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
          draft: false,
        })

        // createdAt from non-versions should be the same as version_createdAt in versions
        expect(fromNonVersionsTable.createdAt).toBe(latestVersionData.version.createdAt)
        // When creating a new version - updatedAt should match
        expect(fromNonVersionsTable.updatedAt).toBe(latestVersionData.version.updatedAt)
      })
    })

    it('should properly clean up old versions when reached versions.max', async () => {
      const getLatestVersion = () =>
        payload
          .findGlobalVersions({
            slug: 'max-versions',
            limit: 1,
            sort: '-createdAt',
          })
          .then((r) => r.docs[0])

      await payload.updateGlobal({ slug: 'max-versions', data: { title: '1' } })
      const version_1 = await getLatestVersion()
      await payload.updateGlobal({ slug: 'max-versions', data: { title: '2' } })
      await payload.updateGlobal({ slug: 'max-versions', data: { title: '3' } })
      const version_1_deleted = await payload.findGlobalVersionByID({
        id: version_1?.id as string,
        slug: 'max-versions',
        disableErrors: true,
      })
      expect(version_1_deleted).toBeFalsy()
    })

    it('findGlobalVersions - pagination should work correctly', async () => {
      for (let i = 0; i < 100; i++) {
        await payload.updateGlobal({ slug: 'draft-unlimited-global', data: { title: 'title' } })
      }
      const res = await payload.findGlobalVersions({
        slug: 'draft-unlimited-global',
      })
      expect(res.totalDocs).toBe(100)
      expect(res.docs).toHaveLength(10)
      const resPaginationFalse = await payload.findGlobalVersions({
        slug: 'draft-unlimited-global',
        pagination: false,
      })
      expect(resPaginationFalse.docs).toHaveLength(100)
      expect(resPaginationFalse.totalDocs).toBe(100)

      const resPaginationFalseLimit0 = await payload.findGlobalVersions({
        slug: 'draft-unlimited-global',
        limit: 0,
        pagination: false,
      })
      expect(resPaginationFalseLimit0.docs).toHaveLength(100)
      expect(resPaginationFalseLimit0.totalDocs).toBe(100)
    })

    describe('Read', () => {
      it('should allow a version to be retrieved by ID', async () => {
        const version = await payload.findGlobalVersionByID({
          id: globalVersionID,
          slug: autoSaveGlobalSlug,
        })

        expect(version.id).toStrictEqual(globalVersionID)
      })

      it('should findGlobalVersions with limit: 0', async () => {
        await payload.db.deleteVersions({ globalSlug: draftUnlimitedGlobalSlug, where: {} })
        for (let i = 0; i < 100; i++) {
          await payload.updateGlobal({ slug: draftUnlimitedGlobalSlug, data: { title: 'global' } })
        }

        const res = await payload.findGlobalVersions({
          slug: draftUnlimitedGlobalSlug,
          limit: 0,
        })

        expect(res.docs).toHaveLength(100)
      })
    })

    describe('Update', () => {
      it('should allow a version to save locales properly', async () => {
        const englishTitle = 'Title in EN'
        const spanishTitle = 'Title in ES'

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            title: englishTitle,
          },
        })

        const updatedGlobalES = await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            title: spanishTitle,
          },
          locale: 'es',
        })

        expect(updatedGlobalES.title).toBe(spanishTitle)

        const newEnglishTitle = 'New title in EN'

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            title: newEnglishTitle,
          },
        })

        const versions = await payload.findGlobalVersions({
          slug: autoSaveGlobalSlug,
          locale: 'all',
        })

        expect(versions.docs[0].version.title.en).toStrictEqual(newEnglishTitle)
        expect(versions.docs[0].version.title.es).toStrictEqual(spanishTitle)
      })

      it('should have correct updatedAt timestamps for globals when saving drafts', async () => {
        const created = await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: {
            title: 'title',
          },
          draft: true,
        })

        await wait(10)

        const updated = await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: {
            title: 'updated title',
          },
          draft: true,
        })

        const createdUpdatedAt = new Date(created.updatedAt)
        const updatedUpdatedAt = new Date(updated.updatedAt)

        expect(Number(updatedUpdatedAt)).toBeGreaterThan(Number(createdUpdatedAt))
      })

      it('should have correct updatedAt timestamps for globals when saving drafts with autosave', async () => {
        const created = await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: {
            title: 'title',
          },
          draft: true,
        })

        await wait(10)

        const updated = await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: {
            title: 'updated title',
          },
          draft: true,
          autosave: true,
        })

        const createdUpdatedAt = new Date(created.updatedAt)
        const updatedUpdatedAt = new Date(updated.updatedAt)

        expect(Number(updatedUpdatedAt)).toBeGreaterThan(Number(createdUpdatedAt))
      })
    })

    describe('Restore', () => {
      it('should allow a version to be restored', async () => {
        const title2 = 'Another updated title in EN'

        const updatedGlobal = await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            title: title2,
          },
        })

        expect(updatedGlobal.title).toBe(title2)

        // Make sure it was updated correctly
        const foundUpdatedGlobal = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
          draft: true,
        })
        expect(foundUpdatedGlobal.title).toBe(title2)

        const versions = await payload.findGlobalVersions({
          slug: autoSaveGlobalSlug,
        })

        const restore = await payload.restoreGlobalVersion({
          id: versions.docs[1]!.id,
          slug: autoSaveGlobalSlug,
        })

        expect(restore.version.title).toBeDefined()

        const restoredGlobal = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
          draft: true,
        })

        expect(restoredGlobal.title).toBe(restore.version.title.en)
      })
    })

    describe('Patch', () => {
      it('should allow a draft to be patched', async () => {
        const originalTitle = 'Here is a published global'

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            _status: 'published',
            description: 'kjnjyhbbdsfseankuhsjsfghb',
            title: originalTitle,
          },
        })

        const publishedGlobal = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
          draft: true,
        })

        const updatedTitle2 = 'Here is a draft global with a patched title'

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            _status: 'draft',
            title: updatedTitle2,
          },
          draft: true,
          locale: 'en',
        })

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            _status: 'draft',
            title: updatedTitle2,
          },
          draft: true,
          locale: 'es',
        })

        const updatedGlobal = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
          draft: true,
          locale: 'all',
        })

        expect(publishedGlobal.title).toBe(originalTitle)
        expect(updatedGlobal.title.en).toBe(updatedTitle2)
        expect(updatedGlobal.title.es).toBe(updatedTitle2)
      })

      it('should allow a draft to be published', async () => {
        const originalTitle = 'Here is a draft'

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            _status: 'draft',
            title: originalTitle,
          },
          draft: true,
        })

        const updatedTitle2 = 'Now try to publish'

        const result = await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            _status: 'published',
            title: updatedTitle2,
          },
        })

        expect(result.title).toBe(updatedTitle2)
      })
    })
  })

  describe('Globals - GraphQL', () => {
    let autosaveGlobalVersionID: number | string

    async function createAndSetVersionID() {
      const update = `mutation {
        updateAutosaveGlobal(draft: true, data: {
          title: "${globalGraphQLOriginalTitle}"
        }) {
          _status
          title
        }
      }`
      await restClient.GRAPHQL_POST({
        body: JSON.stringify({ query: update }),
      })

      // language=graphQL
      const query = `query {
        versionsAutosaveGlobal(where: { version__title: { equals: "${globalGraphQLOriginalTitle}" } }) {
          docs {
            id
            version {
              title
            }
          }
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      autosaveGlobalVersionID = data.versionsAutosaveGlobal.docs[0].id
    }

    beforeEach(async () => {
      await createAndSetVersionID()
    })
    describe('Read', () => {
      it('should allow read of versions by version id', async () => {
        // language=graphql
        const query = `query {
          versionAutosaveGlobal(id: ${formatGraphQLID(autosaveGlobalVersionID)}) {
            id
            version {
              title
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
          })
          .then((res) => res.json())

        expect(data.versionAutosaveGlobal.id).toBeDefined()
        expect(data.versionAutosaveGlobal.version.title).toStrictEqual(globalGraphQLOriginalTitle)
      })

      it('should allow read of versions by querying version content', async () => {
        // language=graphQL
        const query = `query {
          versionsAutosaveGlobal(where: { version__title: {equals: "${globalGraphQLOriginalTitle}" } }) {
            docs {
              id
              version {
                title
              }
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
          })
          .then((res) => res.json())

        const doc = data.versionsAutosaveGlobal.docs[0]

        expect(doc.id).toBeDefined()
        expect(doc.version.title).toStrictEqual(globalGraphQLOriginalTitle)
      })
    })

    describe('Restore', () => {
      it('should allow a version to be restored', async () => {
        const updatedTitle = 'Wrong global title'

        // Update it
        const update = `mutation {
          updateAutosaveGlobal(draft: true, data: {
            title: "${updatedTitle}"
          }) {
            title
          }
        }`
        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: update }),
        })
        // language=graphql
        const restore = `mutation {
          restoreVersionAutosaveGlobal(id: ${formatGraphQLID(autosaveGlobalVersionID)}) {
            title
          }
        }`

        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: restore }),
        })

        const query = `query {
          AutosaveGlobal {
            title
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
          })
          .then((res) => res.json())
        expect(data.AutosaveGlobal).toEqual({ title: globalGraphQLOriginalTitle })
      })
    })
  })

  describe('Scheduled Publish', () => {
    it('should allow collection scheduled publish', async () => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          title: 'my doc to publish in the future',
        },
        draft: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        input: {
          doc: {
            relationTo: draftCollectionSlug,
            value: draft.id,
          },
        },
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
      })

      await wait(4000)

      await payload.jobs.run()

      const retrieved = await payload.findByID({
        id: draft.id,
        collection: draftCollectionSlug,
        draft: false,
      })

      expect(retrieved._status).toStrictEqual('published')

      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug, 'payload-jobs'],
        payload,
      })
    })

    it('should restrict scheduled publish based on user', async () => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          restrictedToUpdate: true,
          title: 'my doc to publish in the future',
        },
        draft: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        input: {
          doc: {
            relationTo: draftCollectionSlug,
            value: draft.id,
          },
          user: user.id,
        },
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
      })

      await wait(4000)

      const res = await payload.jobs.run()

      expect(res.jobStatus[Object.keys(res.jobStatus)[0]].status).toBe('error-reached-max-retries')

      const retrieved = await payload.findByID({
        id: draft.id,
        collection: draftCollectionSlug,
      })

      expect(retrieved._status).toStrictEqual('draft')

      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug, 'payload-jobs'],
        payload,
      })
    })

    it('should allow collection scheduled unpublish', async () => {
      const published = await payload.create({
        collection: draftCollectionSlug,
        data: {
          _status: 'published',
          description: 'hello',
          title: 'my doc to publish in the future',
        },
      })

      expect(published._status).toStrictEqual('published')

      const currentDate = new Date()

      await payload.jobs.queue({
        input: {
          type: 'unpublish',
          doc: {
            relationTo: draftCollectionSlug,
            value: published.id,
          },
        },
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
      })

      await wait(4000)

      await payload.jobs.run()

      const retrieved = await payload.findByID({
        id: published.id,
        collection: draftCollectionSlug,
      })

      expect(retrieved._status).toStrictEqual('draft')

      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug, 'payload-jobs'],
        payload,
      })
    })

    it('should delete scheduled jobs after a document is deleted', async () => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          title: 'my doc to publish in the future',
        },
        draft: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        input: {
          type: 'publish',
          doc: {
            relationTo: draftCollectionSlug,
            value: draft.id,
          },
        },
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
      })

      await payload.delete({
        collection: draftCollectionSlug,
        where: {
          id: { equals: draft.id },
        },
      })

      const { docs } = await payload.find({
        collection: 'payload-jobs',
        where: {
          'input.doc.value': {
            equals: draft.id,
          },
        },
      })

      expect(docs[0]).toBeUndefined()

      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug, 'payload-jobs'],
        payload,
      })
    })

    it('should delete scheduled jobs after a document is deleted by ID', async () => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          title: 'my doc to publish in the future',
        },
        draft: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        input: {
          type: 'publish',
          doc: {
            relationTo: draftCollectionSlug,
            value: draft.id,
          },
        },
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
      })

      await payload.delete({
        id: draft.id,
        collection: draftCollectionSlug,
      })

      const { docs } = await payload.find({
        collection: 'payload-jobs',
        where: {
          'input.doc.value': {
            equals: draft.id,
          },
        },
      })

      expect(docs[0]).toBeUndefined()

      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug, 'payload-jobs'],
        payload,
      })
    })

    it('should allow global scheduled publish', async () => {
      const draft = await payload.updateGlobal({
        slug: draftGlobalSlug,
        data: {
          _status: 'draft',
          title: 'i will publish',
        },
        draft: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        input: {
          global: draftGlobalSlug,
        },
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
      })

      await wait(4000)

      await payload.jobs.run()

      const retrieved = await payload.findGlobal({
        slug: draftGlobalSlug,
      })

      expect(retrieved._status).toStrictEqual('published')
      expect(retrieved.title).toStrictEqual('i will publish')
    })

    it('should allow global scheduled unpublish', async () => {
      const draft = await payload.updateGlobal({
        slug: draftGlobalSlug,
        data: {
          _status: 'published',
          title: 'i will be a draft',
        },
      })

      expect(draft._status).toStrictEqual('published')

      const currentDate = new Date()

      await payload.jobs.queue({
        input: {
          type: 'unpublish',
          global: draftGlobalSlug,
        },
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
      })

      await wait(4000)

      await payload.jobs.run()

      const retrieved = await payload.findGlobal({
        slug: draftGlobalSlug,
      })

      expect(retrieved._status).toStrictEqual('draft')
      expect(retrieved.title).toStrictEqual('i will be a draft')
    })

    it('should not return _status field when access control denies read', async () => {
      // Create a draft global
      const draft = await payload.updateGlobal({
        slug: draftGlobalSlug,
        data: {
          _status: 'draft',
          title: 'draft only',
        },
        draft: true,
      })

      expect(draft._status).toStrictEqual('draft')

      // Create a request without a user (simulating unauthenticated request)
      // Access control on draftGlobalSlug requires published status when no user
      const req = await createLocalReq({}, payload)
      req.user = null

      const result = await payload.findGlobal({
        slug: draftGlobalSlug,
        overrideAccess: false,
        req,
      })

      // Should return empty object, not {_status: 'draft'}
      // The _status field should not be populated with its default value
      expect(Object.keys(result)).toHaveLength(0)
      expect(result._status).toBeUndefined()
    })

    describe('server functions', () => {
      let draftDoc
      let event

      beforeEach(async () => {
        draftDoc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'draft',
            description: 'hello',
            title: 'my doc',
          },
        })
      })

      afterEach(async () => {
        await cleanupDocuments({
          collectionSlugs: ['payload-jobs', draftCollectionSlug],
          payload,
        })
      })

      it('should create using schedule-publish', async () => {
        const currentDate = new Date()

        const req = await createLocalReq({ user }, payload)

        // use server action to create the event
        await schedulePublishHandler({
          type: 'publish',
          date: new Date(currentDate.getTime() + 3000),
          doc: {
            relationTo: draftCollectionSlug,
            value: draftDoc.id,
          },
          locale: 'all',
          req,
          user,
        })

        // fetch the job
        ;[event] = (
          await payload.find({
            collection: 'payload-jobs',
            where: {
              'input.doc.value': {
                equals: draftDoc.id,
              },
            },
          })
        ).docs
        expect(event).toBeDefined()
      })

      it('should delete using schedule-publish', async () => {
        const currentDate = new Date()

        const req = await createLocalReq({ user }, payload)

        // use server action to create the event
        await schedulePublishHandler({
          type: 'publish',
          date: new Date(currentDate.getTime() + 3000),
          doc: {
            relationTo: draftCollectionSlug,
            value: draftDoc.id,
          },
          locale: 'all',
          req,
          user,
        })

        // fetch the job
        ;[event] = (
          await payload.find({
            collection: 'payload-jobs',
            where: {
              'input.doc.value': {
                equals: draftDoc.id,
              },
            },
          })
        ).docs

        // use server action to delete the event
        await schedulePublishHandler({
          deleteID: event.id,
          req,
          user,
        })

        // fetch the job
        ;[event] = (
          await payload.find({
            collection: 'payload-jobs',
            where: {
              'input.doc.value': {
                equals: String(draftDoc.id),
              },
            },
          })
        ).docs

        expect(event).toBeUndefined()

        await cleanupDocuments({
          collectionSlugs: ['payload-jobs', draftCollectionSlug],
          payload,
        })
      })
    })
  })

  describe('Publish Individual Locale', () => {
    const collection = localizedCollectionSlug
    const global = localizedGlobalSlug

    describe('Collections', () => {
      beforeEach(async () => {
        await cleanupDocuments({
          collectionSlugs: [collection],
          payload,
        })
      })

      it('should save correct doc data when publishing individual locale', async () => {
        // save spanish draft
        const draft1 = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        // save english draft
        await payload.update({
          id: draft1.id,
          collection: localizedCollectionSlug,
          data: {
            description: 'My English description',
            text: 'English draft',
          },
          draft: true,
          locale: 'en',
        })

        // save german draft
        await payload.update({
          id: draft1.id,
          collection: localizedCollectionSlug,
          data: {
            text: 'German draft',
          },
          draft: true,
          locale: 'de',
        })

        // publish only english
        await payload.update({
          id: draft1.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'English published 1',
          },
          draft: false,
          locale: 'en',
          publishSpecificLocale: 'en',
        })

        const docWithoutSpanishDraft = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          locale: 'all',
        })

        // We're getting the published version,
        // which should not leak any unpublished Spanish content
        // and should retain the English fields that were not explicitly
        // passed in from publishedEN1
        expect(docWithoutSpanishDraft.text.es).toBeUndefined()
        expect(docWithoutSpanishDraft.description.en).toStrictEqual('My English description')

        const docWithSpanishDraft1 = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          draft: true,
          locale: 'all',
        })

        // After updating English via specific locale,
        // We should expect to see that Spanish translations were maintained
        expect(docWithSpanishDraft1.text.es).toStrictEqual('Spanish draft')
        expect(docWithSpanishDraft1.text.en).toStrictEqual('English published 1')
        expect(docWithSpanishDraft1.description.en).toStrictEqual('My English description')

        await payload.update({
          id: draft1.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'English published 2',
          },
          draft: false,
          locale: 'en',
          publishSpecificLocale: 'en',
        })

        const docWithoutSpanishDraft2 = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          locale: 'all',
        })

        // On the second consecutive publish of a specific locale,
        // Make sure we maintain draft data that has never been published
        // even after two + consecutive publish events
        expect(docWithoutSpanishDraft2.text.es).toBeUndefined()
        expect(docWithoutSpanishDraft2.text.en).toStrictEqual('English published 2')
        expect(docWithoutSpanishDraft2.description.en).toStrictEqual('My English description')

        await payload.update({
          id: draft1.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'draft',
            text: 'German draft 1',
          },
          draft: true,
          locale: 'de',
        })

        const docWithGermanDraft = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          draft: true,
          locale: 'all',
        })

        // Make sure we retain the Spanish draft,
        // which may be lost when we create a new draft with German.
        // Update operation should fetch both draft locales as well as published
        // and merge them.
        expect(docWithGermanDraft.text.de).toStrictEqual('German draft 1')
        expect(docWithGermanDraft.text.es).toStrictEqual('Spanish draft')
        expect(docWithGermanDraft.text.en).toStrictEqual('English published 2')

        await payload.update({
          id: draft1.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'German published 1',
          },
          draft: false,
          locale: 'de',
          publishSpecificLocale: 'de',
        })

        await payload.update({
          id: draft1.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'English published 3',
          },
          draft: false,
          locale: 'en',
          publishSpecificLocale: 'en',
        })

        const finalPublishedNoES = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          locale: 'all',
        })

        expect(finalPublishedNoES.text.de).toStrictEqual('German published 1')
        expect(finalPublishedNoES.text.en).toStrictEqual('English published 3')
        expect(finalPublishedNoES.text.es).toBeUndefined()

        const finalDraft = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          draft: true,
          locale: 'all',
        })

        expect(finalDraft.text.de).toStrictEqual('German published 1')
        expect(finalDraft.text.en).toStrictEqual('English published 3')
        expect(finalDraft.text.es).toStrictEqual('Spanish draft')

        await payload.update({
          id: draft1.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
          },
        })

        const finalPublished = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          draft: true,
          locale: 'all',
        })

        expect(finalPublished.text.de).toStrictEqual('German published 1')
        expect(finalPublished.text.en).toStrictEqual('English published 3')
        expect(finalPublished.text.es).toStrictEqual('Spanish draft')
      })

      it('should not leak draft data', async () => {
        const draft = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'English publish',
          },
          draft: false,
          publishSpecificLocale: 'en',
        })

        const publishedOnlyEN = await payload.findByID({
          id: draft.id,
          collection: localizedCollectionSlug,
          locale: 'all',
        })

        expect(publishedOnlyEN.text.es).toBeUndefined()
        expect(publishedOnlyEN.text.en).toStrictEqual('English publish')
      })

      it('should merge draft data from other locales when publishing all', async () => {
        const draft = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'English publish',
          },
          draft: false,
          publishSpecificLocale: 'en',
        })

        const publishedOnlyEN = await payload.findByID({
          id: draft.id,
          collection: localizedCollectionSlug,
          locale: 'all',
        })

        expect(publishedOnlyEN.text.es).toBeUndefined()
        expect(publishedOnlyEN.text.en).toStrictEqual('English publish')

        const published2 = await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
          },
          draft: false,
        })

        const publishedAll = await payload.findByID({
          id: published2.id,
          collection: localizedCollectionSlug,
          locale: 'all',
        })

        expect(publishedAll.text.es).toStrictEqual('Spanish draft')
        expect(publishedAll.text.en).toStrictEqual('English publish')
      })

      it('should publish non-default individual locale', async () => {
        const draft = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        const published = await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'German publish',
          },
          draft: false,
          publishSpecificLocale: 'de',
        })

        const publishedOnlyDE = await payload.findByID({
          id: published.id,
          collection: localizedCollectionSlug,
          locale: 'all',
        })

        expect(publishedOnlyDE.text.es).toBeUndefined()
        expect(publishedOnlyDE.text.en).toBeUndefined()
        expect(publishedOnlyDE.text.de).toStrictEqual('German publish')
      })

      it('should show correct data in latest version', async () => {
        const draft = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        const published = await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'English publish',
          },
          draft: false,
          publishSpecificLocale: 'en',
        })

        const publishedOnlyEN = await payload.findByID({
          id: published.id,
          collection: localizedCollectionSlug,
          locale: 'all',
        })

        expect(publishedOnlyEN.text.es).toBeUndefined()
        expect(publishedOnlyEN.text.en).toStrictEqual('English publish')

        const allVersions = await payload.findVersions({
          collection: localizedCollectionSlug,
          locale: 'all',
        })

        const versions = allVersions.docs.filter(
          (version) => version.parent === published.id && version.snapshot !== true,
        )
        const latestVersion = versions[0].version

        expect(latestVersion.text.es).toBeUndefined()
        expect(latestVersion.text.en).toStrictEqual('English publish')
      })

      it('should preserve block metadata when publishing specific locale with blocks added after initial save', async () => {
        // Step 1: Create doc without blocks (simulates autosave before blocks are added)
        const draft = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'English draft',
          },
          draft: true,
          locale: 'en',
        })

        // Step 2: Update with blocks
        await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            blocks: [
              {
                blockType: 'block',
                array: [],
              },
            ],
            text: 'English with blocks',
          },
          draft: true,
          locale: 'en',
        })

        // Step 3: Publish only English locale
        const published = await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            blocks: [
              {
                blockType: 'block',
                array: [],
              },
            ],
            text: 'English published with blocks',
          },
          draft: false,
          locale: 'en',
          publishSpecificLocale: 'en',
        })

        // Blocks should be preserved with blockType intact
        expect(published.blocks).toHaveLength(1)
        expect(published.blocks[0].blockType).toBe('block')
        expect(published.blocks[0].id).toBeDefined()

        // Verify via findByID as well
        const found = await payload.findByID({
          id: draft.id,
          collection: localizedCollectionSlug,
        })

        expect(found.blocks).toHaveLength(1)
        expect(found.blocks[0].blockType).toBe('block')
        expect(found.blocks[0].id).toBeDefined()
      })
    })

    describe('Globals', () => {
      beforeEach(async () => {
        // Clear global data by resetting to empty values
        await cleanupGlobal({
          globalSlug: global,
          payload,
        })
      })
      it('should save correct global data when publishing individual locale', async () => {
        // publish german
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'German published',
          },
          locale: 'de',
        })

        // save spanish draft
        await payload.updateGlobal({
          slug: global,
          data: {
            content: 'Spanish draft content',
            title: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        // publish only english
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'Eng published',
          },
          locale: 'en',
          publishSpecificLocale: 'en',
        })

        const globalData = await payload.findGlobal({
          slug: global,
          locale: 'all',
        })

        // Expect only previously published data to be present
        expect(globalData.title.es).toBeUndefined()
        expect(globalData.title.en).toStrictEqual('Eng published')
        expect(globalData.title.de).toStrictEqual('German published')
      })

      it('should not leak draft data', async () => {
        // save spanish draft
        await payload.updateGlobal({
          slug: global,
          data: {
            title: 'Another spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        // publish only english
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'Eng published',
          },
          draft: false,
          locale: 'en',
          publishSpecificLocale: 'en',
        })

        const globalData = await payload.findGlobal({
          slug: global,
          locale: 'all',
        })

        // Expect no draft data to be present
        expect(globalData.title.es).toBeUndefined()
        expect(globalData.title.en).toStrictEqual('Eng published')
      })

      it('should merge draft data from other locales when publishing all', async () => {
        // save spanish draft
        await payload.updateGlobal({
          slug: global,
          data: {
            content: 'Spanish draft content',
            title: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        // publish only english
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'Eng published',
          },
          locale: 'en',
          publishSpecificLocale: 'en',
        })

        const publishedOnlyEN = await payload.findGlobal({
          slug: global,
          locale: 'all',
        })

        expect(publishedOnlyEN.title.es).toBeUndefined()
        expect(publishedOnlyEN.title.en).toStrictEqual('Eng published')

        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
          },
        })

        const publishedAll = await payload.findGlobal({
          slug: global,
          locale: 'all',
        })

        expect(publishedAll.title.es).toStrictEqual('Spanish draft')
        expect(publishedAll.title.en).toStrictEqual('Eng published')
      })

      it('should publish non-default individual locale', async () => {
        // save spanish draft
        await payload.updateGlobal({
          slug: global,
          data: {
            content: 'Test span draft content',
            title: 'Test span draft',
          },
          draft: true,
          locale: 'es',
        })

        // publish only german
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'German published',
          },
          locale: 'de',
          publishSpecificLocale: 'de',
        })

        const globalData = await payload.findGlobal({
          slug: global,
          locale: 'all',
        })

        // Expect only published data to be present
        expect(globalData.title.es).toBeFalsy()
        expect(globalData.title.de).toStrictEqual('German published')
      })

      it('should show correct data in latest version', async () => {
        // save spanish draft
        await payload.updateGlobal({
          slug: global,
          data: {
            content: 'New spanish draft content',
            title: 'New spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        // publish only english
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'New eng',
          },
          draft: false,
          publishSpecificLocale: 'en',
        })

        const allVersions = await payload.findGlobalVersions({
          slug: global,
          locale: 'all',
          where: {
            'version._status': {
              equals: 'published',
            },
          },
        })

        const versions = allVersions.docs
        const latestVersion = versions[0].version
        expect(latestVersion.title.es).toBeFalsy()
        expect(latestVersion.title.en).toStrictEqual('New eng')
      })
    })
  })
})
