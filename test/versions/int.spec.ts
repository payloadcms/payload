import type { Payload } from 'payload'

import { schedulePublishHandler } from '@payloadcms/ui/utilities/schedulePublishHandler'
import path from 'path'
import { createLocalReq, ValidationError } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { clearAndSeedEverything } from './clearAndSeedEverything.js'
import AutosavePosts from './collections/Autosave.js'
import AutosaveGlobal from './globals/Autosave.js'
import {
  autosaveCollectionSlug,
  autoSaveGlobalSlug,
  draftCollectionSlug,
  draftGlobalSlug,
  localizedCollectionSlug,
  localizedGlobalSlug,
} from './slugs.js'

let payload: Payload
let restClient: NextRESTClient

let collectionLocalPostID: string
let collectionLocalVersionID

let token

let collectionGraphQLPostID
let collectionGraphQLVersionID
const collectionGraphQLOriginalTitle = 'autosave title'

const collection = AutosavePosts.slug
const globalSlug = AutosaveGlobal.slug

let globalLocalVersionID
let globalGraphQLVersionID
const globalGraphQLOriginalTitle = 'updated global title'
const updatedTitle = 'Here is an updated post title in EN'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const formatGraphQLID = (id: number | string) =>
  payload.db.defaultIDType === 'number' ? id : `"${id}"`

describe('Versions', () => {
  let user
  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  beforeEach(async () => {
    await clearAndSeedEverything(payload)

    const login = `
      mutation {
        loginUser(
          email: "${devUser.email}",
          password: "${devUser.password}"
        ) {
          token
          user {
            id
          }
        }
      }`
    const { data } = await restClient
      .GRAPHQL_POST({ body: JSON.stringify({ query: login }) })
      .then((res) => res.json())

    user = { ...data.loginUser.user, collection: 'users' }
    token = data.loginUser.token

    // now: initialize
    const autosavePost = await payload.create({
      collection,
      data: {
        description: '345j23o4ifj34jf54g',
        title: 'Here is an autosave post in EN',
      },
    })
    collectionLocalPostID = autosavePost.id

    await payload.update({
      id: collectionLocalPostID,
      collection,
      data: {
        title: updatedTitle,
      },
    })

    const versions = await payload.findVersions({
      collection,
    })

    collectionLocalVersionID = versions.docs[0].id
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
        const updatedPost = await payload.findByID({
          id: collectionLocalPostID,
          collection,
        })
        expect(updatedPost.title).toBe(updatedTitle)
        expect(updatedPost._status).toStrictEqual('draft')
        expect(collectionLocalVersionID).toBeDefined()
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

        expect(versions.docs[0].id).not.toBe(versionsPage2.docs[0].id)
      })

      it('should allow saving multiple versions of models with unique fields', async () => {
        const autosavePost = await payload.create({
          collection,
          data: {
            description: 'description 1',
            title: 'unique unchanging title',
          },
        })

        await payload.update({
          id: autosavePost.id,
          collection,
          data: {
            description: 'description 2',
          },
        })

        const finalDescription = 'final description'

        const secondUpdate = await payload.update({
          id: autosavePost.id,
          collection,
          data: {
            description: finalDescription,
          },
        })

        expect(secondUpdate.description).toBe(finalDescription)
      })

      it('should allow a version to be retrieved by ID', async () => {
        const version = await payload.findVersionByID({
          id: collectionLocalVersionID,
          collection,
        })

        expect(version.id).toStrictEqual(collectionLocalVersionID)
      })

      it('should allow a version to save locales properly', async () => {
        const englishTitle = 'Title in EN'
        const spanishTitle = 'Title in ES'

        await payload.update({
          id: collectionLocalPostID,
          collection,
          data: {
            title: englishTitle,
          },
        })

        const updatedPostES = await payload.update({
          id: collectionLocalPostID,
          collection,
          data: {
            title: spanishTitle,
          },
          locale: 'es',
        })

        expect(updatedPostES.title).toBe(spanishTitle)

        const newEnglishTitle = 'New title in EN'

        await payload.update({
          id: collectionLocalPostID,
          collection,
          data: {
            title: newEnglishTitle,
          },
        })

        const versions = await payload.findVersions({
          collection,
          locale: 'all',
          where: {
            parent: {
              equals: collectionLocalPostID,
            },
          },
        })

        expect(versions.docs[0].version.title.en).toStrictEqual(newEnglishTitle)
        expect(versions.docs[0].version.title.es).toStrictEqual(spanishTitle)
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
          draftsDescending.docs[draftsDescending.docs.length - 1],
        )
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
          draftsDescending.docs[draftsDescending.docs.length - 1],
        )
      })

      it('should have different createdAt in a new version while the same version.createdAt', async () => {
        const doc = await payload.create({
          collection: autosaveCollectionSlug,
          data: { description: 'descr', title: 'title' },
        })

        await wait(10)

        const upd = await payload.update({
          collection: autosaveCollectionSlug,
          id: doc.id,
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
                parent: {
                  equals: doc.id,
                },
                latest: {
                  equals: true,
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
          draft: false,
          id: doc.id,
          collection: autosaveCollectionSlug,
        })

        // createdAt from non-versions should be the same as version_createdAt in versions
        expect(fromNonVersionsTable.createdAt).toBe(latestVersionData.version.createdAt)
        // When creating new version - updatedAt should match version.updatedAt
        expect(fromNonVersionsTable.updatedAt).toBe(latestVersionData.version.updatedAt)
      })
    })

    describe('Restore', () => {
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

        expect(versions.docs[0].version.title).toBe(updatedPost.title)
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
                id: updatedPost.blocksField[0].id,
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
        expect(updatedPost.blocksField[0].text).toBe(updated)
        expect(updatedPost.blocksField[0].localized).toBe(updated)

        // Make sure it was updated correctly
        const draftFromUpdatedPost = await payload.findByID({
          id: versionedPost.id,
          collection: draftCollectionSlug,
          draft: true,
        })
        expect(draftFromUpdatedPost.title).toBe(title2)
        expect(draftFromUpdatedPost.blocksField).toHaveLength(1)
        expect(draftFromUpdatedPost.blocksField[0].localized).toStrictEqual(updated)

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
          id: versionToRestore.id,
          collection: draftCollectionSlug,
        })

        expect({ ...restoredVersion }).toMatchObject({
          ...versionToRestore.version,
          updatedAt: restoredVersion.updatedAt,
        })

        const latestDraft = await payload.findByID({
          id: versionedPost.id,
          collection: draftCollectionSlug,
          draft: true,
        })

        expect(latestDraft).toMatchObject({
          ...versionToRestore.version,
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
          description: 'description',
          title: 'v1',
          _status: 'published',
        },
      })

      // update the post
      await payload.update({
        collection: draftCollectionSlug,
        draft: true,
        id: originalPost.id,
        data: {
          title: 'v2',
          _status: 'published',
        },
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
        id: versionToRestore.id,
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

    describe('Update', () => {
      it('should allow a draft to be patched', async () => {
        const originalTitle = 'Here is a published post'

        const originalPublishedPost = await payload.create({
          collection,
          data: {
            _status: 'published',
            description: 'kjnjyhbbdsfseankuhsjsfghb',
            title: originalTitle,
          },
        })

        const patchedTitle = 'Here is a draft post with a patched title'

        await payload.update({
          id: originalPublishedPost.id,
          collection,
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
          collection,
          data: {
            _status: 'draft',
            title: spanishTitle,
          },
          draft: true,
          locale: 'es',
        })

        const publishedPost = await payload.findByID({
          id: originalPublishedPost.id,
          collection,
        })

        const draftPost = await payload.findByID({
          id: originalPublishedPost.id,
          collection,
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
          collection: draftCollectionSlug,
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

      it('should validate when publishing with the draft arg', async () => {
        // no title (not valid for publishing)
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'desc',
          },
          draft: true,
        })

        await expect(async () => {
          // should not be able to publish a doc that fails validation
          await payload.update({
            id: doc.id,
            collection: draftCollectionSlug,
            data: { _status: 'published' },
            draft: true,
          })
        }).rejects.toThrow(ValidationError)

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
          { id: doc.id, message: 'The following field is invalid: Title' },
        ])
      })

      it('should update with autosave: true', async () => {
        // Save a draft
        const { id } = await payload.create({
          collection: autosaveCollectionSlug,
          draft: true,
          data: { title: 'my-title', description: 'some-description', _status: 'draft' },
        })

        // Autosave the same draft, calls db.updateVersion
        const updated1 = await payload.update({
          collection: autosaveCollectionSlug,
          id,
          data: {
            title: 'new-title',
          },
          autosave: true,
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
          collection: autosaveCollectionSlug,
          id,
          data: {
            title: 'new-title-2',
          },
          autosave: true,
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
      })
    })

    describe('Update Many', () => {
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
      let postToDelete
      beforeEach(async () => {
        postToDelete = await payload.create({
          collection,
          data: {
            _status: 'draft',
            description: 'description',
            title: 'title to delete',
          },
        })
      })
      it('should delete drafts', async () => {
        const drafts = await payload.db.queryDrafts({
          collection,
          where: {
            parent: {
              equals: postToDelete.id,
            },
          },
        })

        await payload.delete({
          collection,
          where: {
            id: { equals: postToDelete.id },
          },
        })

        const result = await payload.db.queryDrafts({
          collection,
          where: {
            parent: {
              in: drafts.docs.map(({ id }) => id),
            },
            // appendVersionToQueryKey,
          },
        })

        expect(result.docs).toHaveLength(0)
      })
    })

    describe('Draft Count', () => {
      it('creates proper number of drafts', async () => {
        const originalDraft = await payload.create({
          collection: 'draft-posts',
          data: {
            _status: 'draft',
            description: 'A',
            title: 'A',
          },
          draft: true,
        })

        await payload.update({
          id: originalDraft.id,
          collection: 'draft-posts',
          data: {
            _status: 'draft',
            description: 'B',
            title: 'B',
          },
          draft: true,
        })

        await payload.update({
          id: originalDraft.id,
          collection: 'draft-posts',
          data: {
            _status: 'draft',
            description: 'C',
            title: 'C',
          },
          draft: true,
        })

        const mostRecentDraft = await payload.findByID({
          id: originalDraft.id,
          collection: 'draft-posts',
          draft: true,
        })

        expect(mostRecentDraft.title).toStrictEqual('C')

        const versions = await payload.findVersions({
          collection: 'draft-posts',
          where: {
            parent: {
              equals: originalDraft.id,
            },
          },
        })

        expect(versions.docs).toHaveLength(3)
      })
    })

    describe('Max Versions', () => {
      // create 2 documents with 3 versions each
      // expect 2 documents with 2 versions each
      it('retains correct versions', async () => {
        const doc1 = await payload.create({
          collection: 'version-posts',
          data: {
            description: 'A',
            title: 'A',
          },
        })

        await payload.update({
          id: doc1.id,
          collection: 'version-posts',
          data: {
            description: 'B',
            title: 'B',
          },
        })

        const result = await payload.find({
          collection: 'version-posts',
          where: {
            updatedAt: { less_than_equal: '2027-01-01T00:00:00.000Z' },
          },
        })

        await payload.update({
          id: doc1.id,
          collection: 'version-posts',
          data: {
            description: 'C',
            title: 'C',
          },
        })

        const doc2 = await payload.create({
          collection: 'version-posts',
          data: {
            description: 'D',
            title: 'D',
          },
        })

        await payload.update({
          id: doc2.id,
          collection: 'version-posts',
          data: {
            description: 'E',
            title: 'E',
          },
        })

        await payload.update({
          id: doc2.id,
          collection: 'version-posts',
          data: {
            description: 'F',
            title: 'F',
          },
        })

        const doc1Versions = await payload.findVersions({
          collection: 'version-posts',
          sort: '-updatedAt',
          where: {
            parent: {
              equals: doc1.id,
            },
          },
        })

        const doc2Versions = await payload.findVersions({
          collection: 'version-posts',
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
          collection: 'version-posts',
        })

        // correctly retains 2 documents in the actual collection
        expect(docs.totalDocs).toStrictEqual(2)
      })
    })

    describe('Race conditions', () => {
      it('should keep latest true with parallel writes', async () => {
        const doc = await payload.create({
          collection: 'draft-posts',
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
                  collection: 'draft-posts',
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
          collection: 'draft-posts',
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
      })
    })
  })

  describe('Querying', () => {
    const originalTitle = 'original title'
    const updatedTitle1 = 'new title 1'
    const updatedTitle2 = 'new title 2'
    let firstDraft

    beforeEach(async () => {
      // This will be created in the `draft-posts` collection
      firstDraft = await payload.create({
        collection: 'draft-posts',
        data: {
          description: 'my description',
          radio: 'test',
          title: originalTitle,
        },
      })

      // This will be created in the `_draft-posts_versions` collection
      await payload.update({
        id: firstDraft.id,
        collection: 'draft-posts',
        data: {
          title: updatedTitle1,
        },
        draft: true,
      })

      // This will be created in the `_draft-posts_versions` collection
      // and will be the newest draft, able to be queried on
      await payload.update({
        id: firstDraft.id,
        collection: 'draft-posts',
        data: {
          title: updatedTitle2,
        },
        draft: true,
      })
    })

    it('should allow querying a draft doc from main collection', async () => {
      const findResults = await payload.find({
        collection: 'draft-posts',
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
        collection: 'draft-posts',
        data: {
          description: 'Description',
          title: 'Title',
        },
      })

      const createVersions = async (int: number = 1) => {
        for (let i = 0; i < int; i++) {
          await payload.update({
            id,
            collection: 'draft-posts',
            data: {
              title: `Title ${i}`,
            },
          })
        }
      }

      await createVersions(10)

      const findResults = await payload.findVersions({
        collection: 'draft-posts',
        where: {
          parent: {
            equals: id,
          },
        },
      })

      expect(findResults.totalDocs).toBe(11)
    })

    it('should not be able to query an old draft version with draft=true', async () => {
      const draftFindResults = await payload.find({
        collection: 'draft-posts',
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
        collection: 'draft-posts',
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
        collection: 'draft-posts',
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
      const allDocs = await payload.find({
        collection: 'draft-posts',
        draft: true,
      })

      expect(allDocs.docs.length).toBeGreaterThan(1)

      const byID = await payload.find({
        collection: 'draft-posts',
        draft: true,
        where: {
          id: {
            equals: allDocs.docs[0].id,
          },
        },
      })

      expect(byID.docs).toHaveLength(1)
    })

    it('should be able to query by id AND any other field with draft=true', async () => {
      const allDocs = await payload.find({
        collection: 'draft-posts',
        draft: true,
        where: {
          title: {
            like: 'title',
          },
        },
      })

      expect(allDocs.docs.length).toBeGreaterThan(1)

      const results = await payload.find({
        collection: 'draft-posts',
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

      expect(results.docs).toHaveLength(allDocs.docs.length - 1)
    })
  })

  describe('Collections - GraphQL', () => {
    beforeEach(async () => {
      const description = 'autosave description'

      const query = `mutation {
          createAutosavePost(data: {title: "${collectionGraphQLOriginalTitle}", description: "${description}"}) {
          id
          title
          description
          createdAt
          updatedAt
          _status
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        .then((res) => res.json())

      collectionGraphQLPostID = data.createAutosavePost.id
    })
    describe('Create', () => {
      it('should allow a new doc to be created with draft status', async () => {
        const description2 = 'other autosave description'

        const query = `mutation {
            createAutosavePost(data: {title: "${'Some other title'}", description: "${description2}"}) {
            id
            title
            description
            createdAt
            updatedAt
            _status
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          .then((res) => res.json())

        expect(data.createAutosavePost._status).toStrictEqual('draft')
      })
    })

    describe('Read', () => {
      const updatedTitle2 = 'updated title'

      beforeEach(async () => {
        // modify the post to create a new version
        // language=graphQL
        const update = `mutation {
          updateAutosavePost(id: ${formatGraphQLID(
            collectionGraphQLPostID,
          )}, data: {title: "${updatedTitle2}"}) {
            title
            updatedAt
            createdAt
          }
        }`
        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: update }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        // language=graphQL
        const query = `query {
          versionsAutosavePosts(where: { parent: { equals: ${formatGraphQLID(
            collectionGraphQLPostID,
          )} } }) {
            docs {
              id
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          .then((res) => res.json())

        collectionGraphQLVersionID = data.versionsAutosavePosts.docs[0].id
      })

      it('should allow read of versions by version id', async () => {
        const query = `query {
          versionAutosavePost(id: ${formatGraphQLID(collectionGraphQLVersionID)}) {
            id
            parent {
              id
            }
            version {
              title
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          .then((res) => res.json())

        expect(data.versionAutosavePost.id).toBeDefined()
        expect(data.versionAutosavePost.parent.id).toStrictEqual(collectionGraphQLPostID)
        expect(data.versionAutosavePost.version.title).toStrictEqual(updatedTitle2)
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
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          .then((res) => res.json())

        const doc = data.versionsAutosavePosts.docs[0]

        expect(doc.id).toBeDefined()
        expect(doc.parent.id).toStrictEqual(collectionGraphQLPostID)
        expect(doc.version.title).toStrictEqual(collectionGraphQLOriginalTitle)
      })
    })

    describe('Restore', () => {
      beforeEach(async () => {
        // modify the post to create a new version
        // language=graphQL
        const update = `mutation {
          updateAutosavePost(id: ${formatGraphQLID(
            collectionGraphQLPostID,
          )}, data: {title: "${collectionGraphQLOriginalTitle}"}) {
            title
            updatedAt
            createdAt
          }
        }`
        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: update }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        // language=graphQL
        const query = `query {
          versionsAutosavePosts(where: { parent: { equals: ${formatGraphQLID(
            collectionGraphQLPostID,
          )} } }) {
            docs {
              id
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          .then((res) => res.json())

        collectionGraphQLVersionID = data.versionsAutosavePosts.docs[0].id
      })
      it('should allow a version to be restored', async () => {
        // Update it
        const update = `mutation {
          updateAutosavePost(id: ${formatGraphQLID(
            collectionGraphQLPostID,
          )}, data: {title: "${'Wrong title'}"}) {
            title
            updatedAt
            createdAt
          }
        }`
        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: update }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        // restore a versionsPost
        const restore = `mutation {
          restoreVersionAutosavePost(id: ${formatGraphQLID(collectionGraphQLVersionID)}) {
            title
          }
        }`

        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: restore }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        const query = `query {
          AutosavePost(id: ${formatGraphQLID(collectionGraphQLPostID)}) {
            title
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          .then((res) => res.json())

        expect(data.AutosavePost.title).toStrictEqual(collectionGraphQLOriginalTitle)
      })
    })
  })

  describe('Collections - REST', () => {
    it('sholud query versions', async () => {
      const response = await restClient.GET(`/${collection}/versions`)
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.docs[0].parent).toBe(collectionLocalPostID)

      const responseByID = await restClient.GET(`/${collection}/versions/${json.docs[0].id}`)
      expect(responseByID.status).toBe(200)
      const jsonByID = await responseByID.json()
      expect(jsonByID.parent).toBe(collectionLocalPostID)
    })
  })

  describe('Globals - Local', () => {
    beforeEach(async () => {
      const title2 = 'Here is an updated global title in EN'
      await payload.updateGlobal({
        slug: globalSlug,
        data: {
          title: 'Test Global',
        },
      })

      await payload.updateGlobal({
        slug: globalSlug,
        data: {
          title: title2,
        },
      })

      const versions = await payload.findGlobalVersions({
        slug: globalSlug,
      })

      globalLocalVersionID = versions.docs[0].id
    })
    describe('Create', () => {
      it('should allow a new version to be created', async () => {
        const title2 = 'Here is an updated global title in EN'
        const updatedGlobal = await payload.findGlobal({
          slug: globalSlug,
        })
        expect(updatedGlobal.title).toBe(title2)
        expect(updatedGlobal._status).toStrictEqual('draft')
        expect(globalLocalVersionID).toBeDefined()
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
          draft: false,
          slug: autoSaveGlobalSlug,
        })

        // createdAt from non-versions should be the same as version_createdAt in versions
        expect(fromNonVersionsTable.createdAt).toBe(latestVersionData.version.createdAt)
        // When creating a new version - updatedAt should match
        expect(fromNonVersionsTable.updatedAt).toBe(latestVersionData.version.updatedAt)
      })
    })

    describe('Read', () => {
      it('should allow a version to be retrieved by ID', async () => {
        const version = await payload.findGlobalVersionByID({
          id: globalLocalVersionID,
          slug: globalSlug,
        })

        expect(version.id).toStrictEqual(globalLocalVersionID)
      })
    })

    describe('Update', () => {
      it('should allow a version to save locales properly', async () => {
        const englishTitle = 'Title in EN'
        const spanishTitle = 'Title in ES'

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: englishTitle,
          },
        })

        const updatedGlobalES = await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: spanishTitle,
          },
          locale: 'es',
        })

        expect(updatedGlobalES.title).toBe(spanishTitle)

        const newEnglishTitle = 'New title in EN'

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: newEnglishTitle,
          },
        })

        const versions = await payload.findGlobalVersions({
          slug: globalSlug,
          locale: 'all',
        })

        expect(versions.docs[0].version.title.en).toStrictEqual(newEnglishTitle)
        expect(versions.docs[0].version.title.es).toStrictEqual(spanishTitle)
      })
    })

    describe('Restore', () => {
      it('should allow a version to be restored', async () => {
        const title2 = 'Another updated title in EN'

        const updatedGlobal = await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: title2,
          },
        })

        expect(updatedGlobal.title).toBe(title2)

        // Make sure it was updated correctly
        const foundUpdatedGlobal = await payload.findGlobal({
          slug: globalSlug,
          draft: true,
        })
        expect(foundUpdatedGlobal.title).toBe(title2)

        const versions = await payload.findGlobalVersions({
          slug: globalSlug,
        })

        globalLocalVersionID = versions.docs[1].id

        const restore = await payload.restoreGlobalVersion({
          id: globalLocalVersionID,
          slug: globalSlug,
        })

        expect(restore.version.title).toBeDefined()

        const restoredGlobal = await payload.findGlobal({
          slug: globalSlug,
          draft: true,
        })

        expect(restoredGlobal.title).toBe(restore.version.title.en)
      })
    })

    describe('Patch', () => {
      it('should allow a draft to be patched', async () => {
        const originalTitle = 'Here is a published global'

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            _status: 'published',
            description: 'kjnjyhbbdsfseankuhsjsfghb',
            title: originalTitle,
          },
        })

        const publishedGlobal = await payload.findGlobal({
          slug: globalSlug,
          draft: true,
        })

        const updatedTitle2 = 'Here is a draft global with a patched title'

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            _status: 'draft',
            title: updatedTitle2,
          },
          draft: true,
          locale: 'en',
        })

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            _status: 'draft',
            title: updatedTitle2,
          },
          draft: true,
          locale: 'es',
        })

        const updatedGlobal = await payload.findGlobal({
          slug: globalSlug,
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
          slug: globalSlug,
          data: {
            _status: 'draft',
            title: originalTitle,
          },
          draft: true,
        })

        const updatedTitle2 = 'Now try to publish'

        const result = await payload.updateGlobal({
          slug: globalSlug,
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
    beforeEach(async () => {
      // language=graphql
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
        headers: {
          Authorization: `JWT ${token}`,
        },
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
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        .then((res) => res.json())

      globalGraphQLVersionID = data.versionsAutosaveGlobal.docs[0].id
    })
    describe('Read', () => {
      it('should allow read of versions by version id', async () => {
        // language=graphql
        const query = `query {
          versionAutosaveGlobal(id: ${formatGraphQLID(globalGraphQLVersionID)}) {
            id
            version {
              title
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            headers: {
              Authorization: `JWT ${token}`,
            },
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
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          .then((res) => res.json())

        const doc = data.versionsAutosaveGlobal.docs[0]

        expect(doc.id).toBeDefined()
        expect(doc.version.title).toStrictEqual(globalGraphQLOriginalTitle)
      })
    })

    describe('Restore', () => {
      it('should allow a version to be restored', async () => {
        // language=graphql
        const restore = `mutation {
          restoreVersionAutosaveGlobal(id: ${formatGraphQLID(globalGraphQLVersionID)}) {
            title
          }
        }`

        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: restore }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        const query = `query {
          AutosaveGlobal {
            title
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            headers: {
              Authorization: `JWT ${token}`,
            },
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
          title: 'my doc to publish in the future',
          description: 'hello',
        },
        draft: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
        input: {
          doc: {
            relationTo: draftCollectionSlug,
            value: draft.id,
          },
        },
      })

      await wait(4000)

      await payload.jobs.run()

      const retrieved = await payload.findByID({
        collection: draftCollectionSlug,
        id: draft.id,
      })

      expect(retrieved._status).toStrictEqual('published')
    })

    it('should restrict scheduled publish based on user', async () => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          title: 'my doc to publish in the future',
          description: 'hello',
          restrictedToUpdate: true,
        },
        draft: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
        input: {
          doc: {
            relationTo: draftCollectionSlug,
            value: draft.id,
          },
          user: user.id,
        },
      })

      await wait(4000)

      const res = await payload.jobs.run()

      expect(res.jobStatus[Object.keys(res.jobStatus)[0]].status).toBe('error-reached-max-retries')

      const retrieved = await payload.findByID({
        collection: draftCollectionSlug,
        id: draft.id,
      })

      expect(retrieved._status).toStrictEqual('draft')
    })

    it('should allow collection scheduled unpublish', async () => {
      const published = await payload.create({
        collection: draftCollectionSlug,
        data: {
          title: 'my doc to publish in the future',
          description: 'hello',
          _status: 'published',
        },
        draft: true,
      })

      expect(published._status).toStrictEqual('published')

      const currentDate = new Date()

      await payload.jobs.queue({
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
        input: {
          type: 'unpublish',
          doc: {
            relationTo: draftCollectionSlug,
            value: published.id,
          },
        },
      })

      await wait(4000)

      await payload.jobs.run()

      const retrieved = await payload.findByID({
        collection: draftCollectionSlug,
        id: published.id,
      })

      expect(retrieved._status).toStrictEqual('draft')
    })

    it('should delete scheduled jobs after a document is deleted', async () => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          title: 'my doc to publish in the future',
          description: 'hello',
        },
        draft: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
        input: {
          type: 'publish',
          doc: {
            relationTo: draftCollectionSlug,
            value: draft.id,
          },
        },
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
    })

    it('should delete scheduled jobs after a document is deleted by ID', async () => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          title: 'my doc to publish in the future',
          description: 'hello',
        },
        draft: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
        input: {
          type: 'publish',
          doc: {
            relationTo: draftCollectionSlug,
            value: draft.id,
          },
        },
      })

      await payload.delete({
        collection: draftCollectionSlug,
        id: draft.id,
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
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
        input: {
          global: draftGlobalSlug,
        },
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
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
        input: {
          type: 'unpublish',
          global: draftGlobalSlug,
        },
      })

      await wait(4000)

      await payload.jobs.run()

      const retrieved = await payload.findGlobal({
        slug: draftGlobalSlug,
      })

      expect(retrieved._status).toStrictEqual('draft')
      expect(retrieved.title).toStrictEqual('i will be a draft')
    })

    describe('server functions', () => {
      let draftDoc
      let event

      beforeAll(async () => {
        draftDoc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            title: 'my doc',
            description: 'hello',
            _status: 'draft',
          },
        })
      })

      it('should create using schedule-publish', async () => {
        const currentDate = new Date()

        const req = await createLocalReq({ user }, payload)

        // use server action to create the event
        await schedulePublishHandler({
          req,
          type: 'publish',
          date: new Date(currentDate.getTime() + 3000),
          doc: {
            relationTo: draftCollectionSlug,
            value: draftDoc.id,
          },
          user,
          locale: 'all',
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
          req,
          type: 'publish',
          date: new Date(currentDate.getTime() + 3000),
          doc: {
            relationTo: draftCollectionSlug,
            value: draftDoc.id,
          },
          user,
          locale: 'all',
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
          req,
          deleteID: event.id,
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
      })
    })
  })

  describe('Publish Individual Locale', () => {
    const collection = localizedCollectionSlug
    const global = localizedGlobalSlug

    describe('Collections', () => {
      let postID: string

      beforeEach(async () => {
        await payload.delete({
          collection,
          where: {},
        })
      })

      it('should save correct doc data when publishing individual locale', async () => {
        // save spanish draft
        const draft1 = await payload.create({
          collection,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        postID = draft1.id as any

        // save english draft
        const draft2 = await payload.update({
          id: postID,
          collection,
          data: {
            text: 'English draft',
            description: 'My English description',
          },
          draft: true,
          locale: 'en',
        })

        // save german draft
        const draft3 = await payload.update({
          id: postID,
          collection,
          data: {
            text: 'German draft',
          },
          draft: true,
          locale: 'de',
        })

        // publish only english
        const publishedEN1 = await payload.update({
          id: postID,
          collection,
          data: {
            text: 'English published 1',
            _status: 'published',
          },
          draft: false,
          locale: 'en',
          publishSpecificLocale: 'en',
        })

        const docWithoutSpanishDraft = await payload.findByID({
          collection,
          id: postID,
          locale: 'all',
        })

        // We're getting the published version,
        // which should not leak any unpublished Spanish content
        // and should retain the English fields that were not explicitly
        // passed in from publishedEN1
        expect(docWithoutSpanishDraft.text.es).toBeUndefined()
        expect(docWithoutSpanishDraft.description.en).toStrictEqual('My English description')

        const docWithSpanishDraft1 = await payload.findByID({
          collection,
          id: postID,
          locale: 'all',
          draft: true,
        })

        // After updating English via specific locale,
        // We should expect to see that Spanish translations were maintained
        expect(docWithSpanishDraft1.text.es).toStrictEqual('Spanish draft')
        expect(docWithSpanishDraft1.text.en).toStrictEqual('English published 1')
        expect(docWithSpanishDraft1.description.en).toStrictEqual('My English description')

        const publishedEN2 = await payload.update({
          id: postID,
          collection,
          data: {
            text: 'English published 2',
            _status: 'published',
          },
          draft: false,
          locale: 'en',
          publishSpecificLocale: 'en',
        })

        const docWithoutSpanishDraft2 = await payload.findByID({
          collection,
          id: postID,
          locale: 'all',
        })

        // On the second consecutive publish of a specific locale,
        // Make sure we maintain draft data that has never been published
        // even after two + consecutive publish events
        expect(docWithoutSpanishDraft2.text.es).toBeUndefined()
        expect(docWithoutSpanishDraft2.text.en).toStrictEqual('English published 2')
        expect(docWithoutSpanishDraft2.description.en).toStrictEqual('My English description')

        await payload.update({
          id: postID,
          collection,
          data: {
            text: 'German draft 1',
            _status: 'draft',
          },
          draft: true,
          locale: 'de',
        })

        const docWithGermanDraft = await payload.findByID({
          collection,
          id: postID,
          locale: 'all',
          draft: true,
        })

        // Make sure we retain the Spanish draft,
        // which may be lost when we create a new draft with German.
        // Update operation should fetch both draft locales as well as published
        // and merge them.
        expect(docWithGermanDraft.text.de).toStrictEqual('German draft 1')
        expect(docWithGermanDraft.text.es).toStrictEqual('Spanish draft')
        expect(docWithGermanDraft.text.en).toStrictEqual('English published 2')

        const publishedDE = await payload.update({
          id: postID,
          collection,
          data: {
            _status: 'published',
            text: 'German published 1',
          },
          draft: false,
          locale: 'de',
          publishSpecificLocale: 'de',
        })

        const publishedENFinal = await payload.update({
          id: postID,
          collection,
          data: {
            text: 'English published 3',
            _status: 'published',
          },
          draft: false,
          locale: 'en',
          publishSpecificLocale: 'en',
        })

        const finalPublishedNoES = await payload.findByID({
          collection,
          id: postID,
          locale: 'all',
        })

        expect(finalPublishedNoES.text.de).toStrictEqual('German published 1')
        expect(finalPublishedNoES.text.en).toStrictEqual('English published 3')
        expect(finalPublishedNoES.text.es).toBeUndefined()

        const finalDraft = await payload.findByID({
          collection,
          id: postID,
          locale: 'all',
          draft: true,
        })

        expect(finalDraft.text.de).toStrictEqual('German published 1')
        expect(finalDraft.text.en).toStrictEqual('English published 3')
        expect(finalDraft.text.es).toStrictEqual('Spanish draft')

        const published = await payload.update({
          collection,
          id: postID,
          data: {
            _status: 'published',
          },
        })

        const finalPublished = await payload.findByID({
          collection,
          id: postID,
          locale: 'all',
          draft: true,
        })

        expect(finalPublished.text.de).toStrictEqual('German published 1')
        expect(finalPublished.text.en).toStrictEqual('English published 3')
        expect(finalPublished.text.es).toStrictEqual('Spanish draft')
      })

      it('should not leak draft data', async () => {
        const draft = await payload.create({
          collection,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        const published = await payload.update({
          id: draft.id,
          collection,
          data: {
            text: 'English publish',
            _status: 'published',
          },
          draft: false,
          publishSpecificLocale: 'en',
        })

        const publishedOnlyEN = await payload.findByID({
          collection,
          id: draft.id,
          locale: 'all',
        })

        expect(publishedOnlyEN.text.es).toBeUndefined()
        expect(publishedOnlyEN.text.en).toStrictEqual('English publish')
      })

      it('should merge draft data from other locales when publishing all', async () => {
        const draft = await payload.create({
          collection,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        const published = await payload.update({
          id: draft.id,
          collection,
          data: {
            text: 'English publish',
            _status: 'published',
          },
          draft: false,
          publishSpecificLocale: 'en',
        })

        const publishedOnlyEN = await payload.findByID({
          collection,
          id: draft.id,
          locale: 'all',
        })

        expect(publishedOnlyEN.text.es).toBeUndefined()
        expect(publishedOnlyEN.text.en).toStrictEqual('English publish')

        const published2 = await payload.update({
          id: draft.id,
          collection,
          data: {
            _status: 'published',
          },
          draft: false,
        })

        const publishedAll = await payload.findByID({
          collection,
          id: published2.id,
          locale: 'all',
        })

        expect(publishedAll.text.es).toStrictEqual('Spanish draft')
        expect(publishedAll.text.en).toStrictEqual('English publish')
      })

      it('should publish non-default individual locale', async () => {
        const draft = await payload.create({
          collection,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        const published = await payload.update({
          id: draft.id,
          collection,
          data: {
            text: 'German publish',
            _status: 'published',
          },
          draft: false,
          publishSpecificLocale: 'de',
        })

        const publishedOnlyDE = await payload.findByID({
          collection,
          id: published.id,
          locale: 'all',
        })

        expect(publishedOnlyDE.text.es).toBeUndefined()
        expect(publishedOnlyDE.text.en).toBeUndefined()
        expect(publishedOnlyDE.text.de).toStrictEqual('German publish')
      })

      it('should show correct data in latest version', async () => {
        const draft = await payload.create({
          collection,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
        })

        const published = await payload.update({
          id: draft.id,
          collection,
          data: {
            text: 'English publish',
            _status: 'published',
          },
          draft: false,
          publishSpecificLocale: 'en',
        })

        const publishedOnlyEN = await payload.findByID({
          collection,
          id: published.id,
          locale: 'all',
        })

        expect(publishedOnlyEN.text.es).toBeUndefined()
        expect(publishedOnlyEN.text.en).toStrictEqual('English publish')

        const allVersions = await payload.findVersions({
          collection,
          locale: 'all',
        })

        const versions = allVersions.docs.filter(
          (version) => version.parent === published.id && version.snapshot !== true,
        )
        const latestVersion = versions[0].version

        expect(latestVersion.text.es).toBeUndefined()
        expect(latestVersion.text.en).toStrictEqual('English publish')
      })
    })

    describe('Globals', () => {
      it('should save correct global data when publishing individual locale', async () => {
        // publish german
        await payload.updateGlobal({
          slug: global,
          data: {
            title: 'German published',
            _status: 'published',
          },
          locale: 'de',
        })

        // save spanish draft
        await payload.updateGlobal({
          slug: global,
          data: {
            title: 'Spanish draft',
            content: 'Spanish draft content',
          },
          draft: true,
          locale: 'es',
        })

        // publish only english
        await payload.updateGlobal({
          slug: global,
          data: {
            title: 'Eng published',
            _status: 'published',
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
            title: 'Eng published',
            _status: 'published',
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
            title: 'Spanish draft',
            content: 'Spanish draft content',
          },
          draft: true,
          locale: 'es',
        })

        // publish only english
        await payload.updateGlobal({
          slug: global,
          data: {
            title: 'Eng published',
            _status: 'published',
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
            title: 'Test span draft',
            content: 'Test span draft content',
          },
          draft: true,
          locale: 'es',
        })

        // publish only german
        await payload.updateGlobal({
          slug: global,
          data: {
            title: 'German published',
            _status: 'published',
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
            title: 'New spanish draft',
            content: 'New spanish draft content',
          },
          draft: true,
          locale: 'es',
        })

        // publish only english
        await payload.updateGlobal({
          slug: global,
          data: {
            title: 'New eng',
            _status: 'published',
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
