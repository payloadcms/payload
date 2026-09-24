import type { JsonObject, Payload } from 'payload'

import {
  getUpcomingScheduledPublishHandler,
  schedulePublishHandler,
} from '@payloadcms/ui/utilities/schedulePublishHandler'
import fs from 'fs'
import path from 'path'
import {
  createLocalReq,
  Forbidden,
  getFileByPath,
  NotFound,
  saveVersion,
  ValidationError,
} from 'payload'
import { wait } from 'payload/shared'
import * as qs from 'qs-esm'
import { fileURLToPath } from 'url'
import { expect, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { AutosaveMultiSelectPost, DraftPost } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { cloudStorageDeletedFilenames } from './collections/DraftsWithUploadCloudStorage.js'
import { cleanupDocuments, cleanupGlobal, createDraftDocument } from './helpers.js'
import {
  autosaveCollectionSlug,
  autoSaveGlobalSlug,
  autosaveWithMultiSelectCollectionSlug,
  draftCollectionSlug,
  draftGlobalSlug,
  draftUnlimitedGlobalSlug,
  draftWithUploadCloudStorageCollectionSlug,
  draftWithUploadCollectionSlug,
  errorOnUnpublishSlug,
  localizedCollectionSlug,
  localizedGlobalSlug,
  nestedArraySelectCollectionSlug,
  restoreAccessCollectionSlug,
  restoreAccessGlobalSlug,
  restoreAccessLocalizedCollectionSlug,
  restoreAccessNoVersionsGlobalSlug,
  secondaryAdminUserCollectionSlug,
  versionCollectionSlug,
} from './slugs.js'

const collectionGraphQLOriginalTitle = 'autosave title'

const globalGraphQLOriginalTitle = 'updated global title'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const formatGraphQLID = ({ payload }: { payload: Payload }, id: number | string) =>
  payload.db.defaultIDType === 'number' ? id : `"${id}"`

test.suite('Versions', { config: './config.ts', resetBetweenTests: false }, () => {
  let secondaryAdminUser: JsonObject
  let user: JsonObject

  test.beforeAll(async ({ payloadInstance: payload, restClientInstance: restClient }) => {
    const { user: loggedInUser } = await restClient.login({
      slug: 'users',
      credentials: devUser,
    })
    user = {
      ...loggedInUser,
      collection: 'users',
    }

    const newSecondaryAdminUser = await payload.create({
      collection: secondaryAdminUserCollectionSlug,
      data: {
        email: 'secondary-admin@payloadcms.com',
        password: devUser.password,
      },
      depth: 0,
      overrideAccess: true,
    })

    secondaryAdminUser = {
      ...newSecondaryAdminUser,
      collection: secondaryAdminUserCollectionSlug,
    }
  })

  test.afterEach(async ({ payload }) => {
    await payload.delete({
      collection: 'payload-jobs',
      overrideAccess: true,
      where: {},
    })
  })

  test.describe('Collections - Local', () => {
    test('should reject invalid IDs before finding a draft collection document', async ({
      payload,
    }) => {
      const invalidIDs: unknown[] = [undefined, null, '', Number.NaN, Number.POSITIVE_INFINITY, {}]

      for (const invalidID of invalidIDs) {
        await expect(
          payload.findByID({
            id: invalidID as string,
            collection: draftCollectionSlug,
            draft: true,
          }),
        ).rejects.toBeInstanceOf(NotFound)
      }
    })

    test.describe('Create', () => {
      test('should allow creating a draft with missing required field data', async ({
        payload,
      }) => {
        const draft = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            description: undefined,
            title: 'i have a title',
          },
          draft: true,
          overrideAccess: true,
        })

        expect(draft.id).toBeDefined()
      })

      test('should allow a new version to be created and updated', async ({ payload }) => {
        const updatedTitle = 'Here is an updated post title in EN'

        // Create initial post
        const autosavePost = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            description: '345j23o4ifj34jf54g',
            title: 'Here is an autosave post in EN',
          },
          overrideAccess: true,
        })

        // Update to create a version
        await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            title: updatedTitle,
          },
          overrideAccess: true,
        })

        // Get versions
        const versions = await payload.findVersions({
          collection: autosaveCollectionSlug,
          overrideAccess: true,
          where: {
            parent: {
              equals: autosavePost.id,
            },
          },
        })

        const updatedPost = await payload.findByID({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          overrideAccess: true,
        })
        expect(updatedPost.title).toBe(updatedTitle)
        expect(updatedPost._status).toStrictEqual('draft')
        expect(versions.docs[0].id).toBeDefined()
      })

      test('should allow saving multiple versions of models with unique fields', async ({
        payload,
      }) => {
        const autosavePost = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            description: 'description 1',
            title: 'unique unchanging title',
          },
          overrideAccess: true,
        })

        await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            description: 'description 2',
          },
          overrideAccess: true,
        })

        const finalDescription = 'final description'

        const secondUpdate = await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            description: finalDescription,
          },
          overrideAccess: true,
        })

        expect(secondUpdate.description).toBe(finalDescription)
      })

      test('should allow a version to be retrieved by ID', async ({ payload }) => {
        // Create a post and update it to generate a version
        const autosavePost = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            description: 'test description',
            title: 'initial title',
          },
          overrideAccess: true,
        })

        await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            title: 'updated title',
          },
          overrideAccess: true,
        })

        // Get the version ID
        const versions = await payload.findVersions({
          collection: autosaveCollectionSlug,
          overrideAccess: true,
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
          overrideAccess: true,
        })

        expect(version.id).toStrictEqual(versionID)
      })

      test('should allow a version to save locales properly', async ({ payload }) => {
        const englishTitle = 'Title in EN'
        const spanishTitle = 'Title in ES'

        // Create initial post
        const autosavePost = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            description: 'test description',
            title: 'initial title',
          },
          overrideAccess: true,
        })

        await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            title: englishTitle,
          },
          overrideAccess: true,
        })

        const updatedPostES = await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            title: spanishTitle,
          },
          locale: 'es',
          overrideAccess: true,
        })

        expect(updatedPostES.title).toBe(spanishTitle)

        const newEnglishTitle = 'New title in EN'

        await payload.update({
          id: autosavePost.id,
          collection: autosaveCollectionSlug,
          data: {
            title: newEnglishTitle,
          },
          overrideAccess: true,
        })

        const versions = await payload.findVersions({
          collection: autosaveCollectionSlug,
          locale: 'all',
          overrideAccess: true,
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
      test('should query drafts with relation', async ({ payload }) => {
        const draftPost = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'Description',
            title: 'Some Title',
          },
          overrideAccess: true,
        })

        await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'Description',
            relation: draftPost.id,
            title: 'With Relation',
          },
          overrideAccess: true,
        })

        const query = {
          collection: draftCollectionSlug,
          overrideAccess: true,
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

      test('should have different createdAt in a new version while the same version.createdAt', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: autosaveCollectionSlug,
          data: { description: 'descr', title: 'title' },
          overrideAccess: true,
        })

        await wait(10)

        const upd = await payload.update({
          id: doc.id,
          collection: autosaveCollectionSlug,
          data: {},
          overrideAccess: true,
        })

        expect(upd.createdAt).toBe(doc.createdAt)

        const {
          docs: [latestVersionData],
        } = await payload.findVersions({
          collection: autosaveCollectionSlug,
          overrideAccess: true,
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
          overrideAccess: true,
        })

        // createdAt from non-versions should be the same as version_createdAt in versions
        expect(fromNonVersionsTable.createdAt).toBe(latestVersionData.version.createdAt)
        // When creating new version - updatedAt should match version.updatedAt
        expect(fromNonVersionsTable.updatedAt).toBe(latestVersionData.version.updatedAt)
      })

      test('should allow to create with a localized relationships inside a localized array and a block', async ({
        payload,
      }) => {
        const post = await payload.create({ collection: 'posts', data: {}, overrideAccess: true })
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
          overrideAccess: true,
        })
        expect(res.blocks[0]?.array[0]?.relationship).toEqual(post.id)
        const {
          docs: [resFromVersions],
        } = await payload.findVersions({
          collection: 'localized-posts',
          depth: 0,
          overrideAccess: true,
          where: { parent: { equals: res.id } },
        })
        expect(resFromVersions?.version.blocks[0]?.array[0]?.relationship).toEqual(post.id)
      })

      test('should not create new versions with autosave:true', async ({ payload }) => {
        const post = await payload.create({
          collection: 'autosave-posts',
          data: { _status: 'draft', description: 'description', title: 'post' },
          draft: true,
          overrideAccess: true,
        })

        await payload.update({
          id: post.id,
          autosave: true,
          collection: 'autosave-posts',
          data: { title: 'autosave' },
          draft: true,
          overrideAccess: true,
        })

        const getVersionsCount = async () => {
          const { totalDocs: versionsCount } = await payload.countVersions({
            collection: 'autosave-posts',
            overrideAccess: true,
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
          overrideAccess: true,
        })

        expect(await getVersionsCount()).toBe(2)

        // where
        await payload.update({
          autosave: true,
          collection: 'autosave-posts',
          data: { title: 'post-updated-2' },
          draft: true,
          overrideAccess: true,
          where: { id: { equals: post.id } },
        })
        expect(await getVersionsCount()).toBe(2)
      })

      test('should show autosave changes after reload on a published document', async ({
        payload,
      }) => {
        // Bug: When autosave is enabled, editing a published document and then reloading
        // should show the draft changes ("Changed" status). Previously, reload showed
        // "Published" status with the button disabled, even though draft content persisted.
        const published = await payload.create({
          collection: autosaveCollectionSlug,
          data: { _status: 'published', description: 'original', title: 'Published Post' },
          overrideAccess: true,
        })

        // Autosave a change on the published document
        await payload.update({
          id: published.id,
          autosave: true,
          collection: autosaveCollectionSlug,
          data: { title: 'Autosaved Title' },
          draft: true,
          overrideAccess: true,
        })

        // Simulate page reload: read the latest draft version (what getLatestCollectionVersion does)
        const { docs: latestVersions } = await payload.findVersions({
          collection: autosaveCollectionSlug,
          limit: 1,
          overrideAccess: true,
          sort: '-updatedAt',
          where: {
            and: [{ parent: { equals: published.id } }, { latest: { equals: true } }],
          },
        })

        expect(latestVersions).toHaveLength(1)
        expect(latestVersions[0].version.title).toBe('Autosaved Title')
        // The draft version should exist and be findable, proving the UI would show "Changed"
      })

      test('should update existing draft version during repeated autosaves instead of creating new ones', async ({
        payload,
      }) => {
        // Bug: Auto Save when changing content kept adding a new version EVERY time
        // instead of updating the existing draft one.
        const published = await payload.create({
          collection: autosaveCollectionSlug,
          data: { _status: 'published', description: 'desc', title: 'Original' },
          overrideAccess: true,
        })

        // First autosave creates a draft version
        await payload.update({
          id: published.id,
          autosave: true,
          collection: autosaveCollectionSlug,
          data: { title: 'Change 1' },
          draft: true,
          overrideAccess: true,
        })

        const countAfterFirst = await payload.countVersions({
          collection: autosaveCollectionSlug,
          overrideAccess: true,
          where: { parent: { equals: published.id } },
        })

        // Second autosave should update the existing draft, NOT create a new one
        await payload.update({
          id: published.id,
          autosave: true,
          collection: autosaveCollectionSlug,
          data: { title: 'Change 2' },
          draft: true,
          overrideAccess: true,
        })

        const countAfterSecond = await payload.countVersions({
          collection: autosaveCollectionSlug,
          overrideAccess: true,
          where: { parent: { equals: published.id } },
        })

        expect(countAfterSecond.totalDocs).toBe(countAfterFirst.totalDocs)

        // Third autosave — still same count
        await payload.update({
          id: published.id,
          autosave: true,
          collection: autosaveCollectionSlug,
          data: { title: 'Change 3' },
          draft: true,
          overrideAccess: true,
        })

        const countAfterThird = await payload.countVersions({
          collection: autosaveCollectionSlug,
          overrideAccess: true,
          where: { parent: { equals: published.id } },
        })

        expect(countAfterThird.totalDocs).toBe(countAfterFirst.totalDocs)

        // Verify the latest version has the most recent content
        const { docs } = await payload.findVersions({
          collection: autosaveCollectionSlug,
          limit: 1,
          overrideAccess: true,
          sort: '-updatedAt',
          where: { parent: { equals: published.id } },
        })

        expect(docs[0].version.title).toBe('Change 3')
      })

      test('should return null when saving a version with returning:false', async ({ payload }) => {
        const collection = autosaveCollectionSlug
        const collectionConfig = payload.collections[autosaveCollectionSlug].config

        const post = await payload.create({
          collection,
          data: { description: 'description' },
          draft: true,
          overrideAccess: true,
        })

        const docWithLocales = await payload.findByID({
          id: post.id,
          collection,
          locale: 'all',
          overrideAccess: true,
        })

        const result = await saveVersion({
          id: post.id,
          collection: collectionConfig,
          docWithLocales,
          operation: 'create',
          payload,
          returning: false,
        })

        expect(result).toBeNull()
      })
    })

    test.describe('Duplicate', () => {
      test('should duplicate a versioned document as a draft', async ({ payload }) => {
        const originalDoc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'published',
            description: 'Original description',
            title: 'Original Title',
          },
          draft: false,
          overrideAccess: true,
        })

        const duplicatedDoc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'draft',
          },
          draft: true,
          duplicateFromID: originalDoc.id,
          overrideAccess: true,
        })

        expect(duplicatedDoc._status).toBe('draft')

        await payload.delete({
          id: originalDoc.id,
          collection: draftCollectionSlug,
          overrideAccess: true,
        })
        await payload.delete({
          id: duplicatedDoc.id,
          collection: draftCollectionSlug,
          overrideAccess: true,
        })
      })

      test('should duplicate a draft document with empty required fields via local API', async ({
        payload,
      }) => {
        const originalDoc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'draft',
            title: 'Draft with partial data',
          },
          draft: true,
          overrideAccess: true,
        })

        // description is required but missing — duplicate should still succeed as a draft
        const duplicatedDoc = await payload.duplicate({
          id: originalDoc.id,
          collection: draftCollectionSlug,
          draft: true,
          overrideAccess: true,
        })

        expect(duplicatedDoc._status).toBe('draft')
        expect(duplicatedDoc.id).not.toEqual(originalDoc.id)
        expect(duplicatedDoc.title).toContain('Draft with partial data')

        await payload.delete({
          id: originalDoc.id,
          collection: draftCollectionSlug,
          overrideAccess: true,
        })
        await payload.delete({
          id: duplicatedDoc.id,
          collection: draftCollectionSlug,
          overrideAccess: true,
        })
      })

      test('should duplicate a draft document with empty required fields via REST API without explicit draft param', async ({
        payload,
        restClient,
      }) => {
        const originalDoc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'draft',
            title: 'REST draft partial',
          },
          draft: true,
          overrideAccess: true,
        })

        // Mimics the admin UI: POST to /:collection/:id/duplicate
        // with { _status: 'draft' } in body and NO draft query parameter
        const response = await restClient.POST(
          `/${draftCollectionSlug}/${originalDoc.id}/duplicate`,
          {
            body: JSON.stringify({ _status: 'draft' }),
          },
        )

        const { doc } = await response.json()

        expect(response.status).toBe(200)
        expect(doc._status).toBe('draft')
        expect(doc.id).not.toEqual(originalDoc.id)

        await payload.delete({
          id: originalDoc.id,
          collection: draftCollectionSlug,
          overrideAccess: true,
        })
        await payload.delete({ id: doc.id, collection: draftCollectionSlug, overrideAccess: true })
      })
    })

    test.describe('Query operations', () => {
      test('should paginate versions', async ({ payload }) => {
        const versions = await payload.findVersions({
          collection: draftCollectionSlug,
          limit: 5,
          overrideAccess: true,
        })
        const versionsPage2 = await payload.findVersions({
          collection: draftCollectionSlug,
          limit: 5,
          overrideAccess: true,
          page: 2,
        })

        expect(versions.docs).toHaveLength(5)
        expect(versions.page).toBe(1)
        expect(versionsPage2.docs).toHaveLength(5)
        expect(versionsPage2.page).toBe(2)

        expect(versions.docs[0]!.id).not.toBe(versionsPage2.docs[0]!.id)
      })

      test('should query drafts with sort', async ({ payload }) => {
        const draftsAscending = await payload.find({
          collection: draftCollectionSlug,
          draft: true,
          overrideAccess: true,
          sort: 'title',
        })

        const draftsDescending = await payload.find({
          collection: draftCollectionSlug,
          draft: true,
          overrideAccess: true,
          sort: '-title',
        })

        expect(draftsAscending).toBeDefined()
        expect(draftsDescending).toBeDefined()
        expect(draftsAscending.docs[0]).toMatchObject(
          draftsDescending.docs[draftsDescending.docs.length - 1],
        )
      })

      test('should `findVersions` with sort', async ({ payload }) => {
        const draftsAscending = await payload.findVersions({
          collection: draftCollectionSlug,
          draft: true,
          limit: 100,
          overrideAccess: true,
          sort: 'createdAt',
        })

        const draftsDescending = await payload.findVersions({
          collection: draftCollectionSlug,
          draft: true,
          limit: 100,
          overrideAccess: true,
          sort: '-createdAt',
        })

        expect(draftsAscending).toBeDefined()
        expect(draftsDescending).toBeDefined()
        expect(draftsAscending.docs[0]).toMatchObject(
          draftsDescending.docs[draftsDescending.docs.length - 1],
        )
      })

      test('should findVersions with limit: 0', async ({ payload }) => {
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: { description: 'a', title: 'test-doc' },
          overrideAccess: true,
        })

        for (let i = 0; i < 100; i++) {
          await payload.update({
            id: doc.id,
            collection: draftCollectionSlug,
            data: {},
            overrideAccess: true,
          })
        }
        const res = await payload.findVersions({
          collection: draftCollectionSlug,
          limit: 0,
          overrideAccess: true,
          where: { parent: { equals: doc.id } },
        })
        expect(res.docs).toHaveLength(101)
      })
    })

    test.describe('Draft read access', () => {
      const createdDocumentIDs: (number | string)[] = []

      test.afterEach(async ({ payload }) => {
        for (const id of createdDocumentIDs) {
          await payload.delete({ id, collection: draftCollectionSlug, overrideAccess: true })
        }
        createdDocumentIDs.length = 0
      })

      test('should return a base document without versions when reading drafts', async ({
        payload,
      }) => {
        const document = await payload.db.create({
          collection: draftCollectionSlug,
          data: {
            description: 'Document created before drafts were enabled',
          },
        })
        createdDocumentIDs.push(document.id)

        const result = await payload.findByID({
          id: document.id,
          collection: draftCollectionSlug,
          draft: true,
          overrideAccess: false,
        })

        expect(result).toMatchObject({
          id: document.id,
          description: 'Document created before drafts were enabled',
        })
      })

      test('should evaluate findByID access against the latest draft when the base document is denied', async ({
        payload,
      }) => {
        const document = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'base denied',
            title: 'Draft access allowed',
          },
          draft: true,
          overrideAccess: true,
        })
        createdDocumentIDs.push(document.id)

        await payload.update({
          id: document.id,
          collection: draftCollectionSlug,
          data: {
            description: 'draft allowed',
          },
          draft: true,
          overrideAccess: true,
        })

        const result = await payload.findByID({
          id: document.id,
          collection: draftCollectionSlug,
          context: {
            draftAccessDescription: 'draft allowed',
          },
          disableErrors: true,
          draft: true,
          overrideAccess: false,
        })

        expect(result?.description).toBe('draft allowed')
      })

      test('should deny findByID access when only the base document matches', async ({
        payload,
      }) => {
        const document = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'base allowed',
            title: 'Draft access denied',
          },
          draft: true,
          overrideAccess: true,
        })
        createdDocumentIDs.push(document.id)

        await payload.update({
          id: document.id,
          collection: draftCollectionSlug,
          data: {
            description: 'draft denied',
          },
          draft: true,
          overrideAccess: true,
        })

        const result = await payload.findByID({
          id: document.id,
          collection: draftCollectionSlug,
          context: {
            draftAccessDescription: 'base allowed',
          },
          disableErrors: true,
          draft: true,
          overrideAccess: false,
        })

        expect(result).toBeNull()
      })
    })

    test.describe('Restore', () => {
      test.afterEach(async ({ payload }) => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug],
          payload,
        })
      })

      test('should return `findVersions` in correct order', async ({ payload }) => {
        const somePost = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'description 1',
            title: 'first post',
          },
          overrideAccess: true,
        })

        const updatedPost = await payload.update({
          id: somePost.id,
          collection: draftCollectionSlug,
          data: {
            title: 'This should be the latest version',
          },
          overrideAccess: true,
        })

        const versions = await payload.findVersions({
          collection: draftCollectionSlug,
          overrideAccess: true,
          where: {
            parent: { equals: somePost.id },
          },
        })

        expect(versions.docs[0]!.version.title).toBe(updatedPost.title)
      })
      test('should allow a version to be restored', async ({ payload }) => {
        const title2 = 'Another updated post title in EN'
        const updated = 'updated'

        const versionedPost = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'version description',
            title: 'version title',
          },
          draft: true,
          overrideAccess: true,
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
          overrideAccess: true,
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
          overrideAccess: true,
        })

        expect(updatedPost.title).toBe(title2)
        expect(updatedPost.blocksField?.[0]!.text).toBe(updated)
        expect(updatedPost.blocksField?.[0]!.localized).toBe(updated)

        // Make sure it was updated correctly
        const draftFromUpdatedPost = await payload.findByID({
          id: versionedPost.id,
          collection: draftCollectionSlug,
          draft: true,
          overrideAccess: true,
        })
        expect(draftFromUpdatedPost.title).toBe(title2)
        expect(draftFromUpdatedPost.blocksField).toHaveLength(1)
        expect(draftFromUpdatedPost.blocksField?.[0]!.localized).toStrictEqual(updated)

        const versions = await payload.findVersions({
          collection: draftCollectionSlug,
          overrideAccess: true,
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
          overrideAccess: true,
        })

        expect({ ...restoredVersion }).toMatchObject({
          ...versionToRestore!.version,
          updatedAt: restoredVersion.updatedAt,
        })

        const latestDraft = await payload.findByID({
          id: versionedPost.id,
          collection: draftCollectionSlug,
          draft: true,
          overrideAccess: true,
        })

        expect(latestDraft).toMatchObject({
          ...versionToRestore!.version,
          // timestamps cannot be guaranteed to be the exact same to the milliseconds
          createdAt: latestDraft.createdAt,
          updatedAt: latestDraft.updatedAt,
        })
        expect(latestDraft.blocksField).toHaveLength(0)
      })

      test('should restore a version via REST when a relationship field with filterOptions is set', async ({
        payload,
        restClient,
      }) => {
        const target = await payload.create({
          collection: draftCollectionSlug,
          data: { description: 'target', title: 'filter-options target' },
          draft: true,
          overrideAccess: true,
        })

        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'has relation',
            relationWithFilterOptions: [target.id],
            title: 'filter-options doc',
          },
          draft: true,
          overrideAccess: true,
        })

        await payload.update({
          id: doc.id,
          collection: draftCollectionSlug,
          data: {
            relationWithFilterOptions: [target.id],
            title: 'filter-options doc updated',
          },
          draft: true,
          overrideAccess: true,
        })

        const versions = await payload.findVersions({
          collection: draftCollectionSlug,
          overrideAccess: true,
          where: { parent: { equals: doc.id } },
        })

        const versionToRestore = versions.docs[versions.docs.length - 1]
        expect(versionToRestore?.version.relationWithFilterOptions).toBeDefined()

        // Mimics the admin UI restore button: POST /:collection/versions/:id
        const response = await restClient.POST(
          `/${draftCollectionSlug}/versions/${versionToRestore!.id}`,
        )
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.errors).toBeUndefined()

        const restored = await payload.findByID({
          id: doc.id,
          collection: draftCollectionSlug,
          depth: 0,
          draft: true,
          overrideAccess: true,
        })
        expect(restored.relationWithFilterOptions).toStrictEqual([target.id])

        await payload.delete({ id: doc.id, collection: draftCollectionSlug, overrideAccess: true })
        await payload.delete({
          id: target.id,
          collection: draftCollectionSlug,
          overrideAccess: true,
        })
      })

      test('should not copy current document fields into restored version', async ({ payload }) => {
        // Create doc with a block (only text set), leaving radio/select/localized unset
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            blocksField: [
              {
                blockType: 'block',
                text: 'original-text',
              },
            ],
            description: 'initial description',
            title: 'leak test',
          },
          draft: true,
          overrideAccess: true,
        })

        const blockId = doc.blocksField?.[0]!.id

        // Update doc to set radio, select, and block localized field
        await payload.update({
          id: doc.id,
          collection: draftCollectionSlug,
          data: {
            blocksField: [
              {
                id: blockId,
                blockType: 'block',
                localized: 'leaked-value',
                text: 'original-text',
              },
            ],
            description: 'updated description',
            radio: 'test',
            select: ['test1'],
            title: 'leak test',
          },
          draft: true,
          overrideAccess: true,
        })

        // Find versions and restore the original (oldest) version
        const versions = await payload.findVersions({
          collection: draftCollectionSlug,
          overrideAccess: true,
          where: { parent: { equals: doc.id } },
        })

        const originalVersion = versions.docs[versions.docs.length - 1]

        await payload.restoreVersion({
          id: originalVersion!.id,
          collection: draftCollectionSlug,
          overrideAccess: true,
        })

        const restored = await payload.findByID({
          id: doc.id,
          collection: draftCollectionSlug,
          draft: true,
          overrideAccess: true,
        })

        // Top-level fields should NOT have leaked from the updated version
        expect(restored.radio).toBeFalsy()
        expect(restored.select).toEqual([])

        // Block sub-fields should NOT have leaked either
        expect(restored.blocksField?.[0]!.localized).toBeFalsy()
        expect(restored.blocksField?.[0]!.text).toBe('original-text')
      })
    })

    test('should restore published version with correct data', async ({ payload }) => {
      // create a post
      const originalPost = await payload.create({
        collection: draftCollectionSlug,
        data: {
          _status: 'published',
          description: 'description',
          title: 'v1',
        },
        overrideAccess: true,
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
        overrideAccess: true,
      })

      // get the version id of the original draft
      const versions = await payload.findVersions({
        collection: draftCollectionSlug,
        overrideAccess: true,
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
        overrideAccess: true,
      })

      // get the latest draft
      const latestDraft = await payload.findByID({
        id: originalPost.id,
        collection: draftCollectionSlug,
        draft: true,
        overrideAccess: true,
      })

      // assert it has the original post content
      expect(latestDraft.title).toStrictEqual('v1')
      expect(restoredVersion.title).toStrictEqual('v1')
    })

    test('should restore a published version when required localized fields are empty in a non-default locale', async ({
      payload,
    }) => {
      const originalPost = await payload.create({
        collection: draftCollectionSlug,
        data: {
          _status: 'published',
          description: 'description v1',
          title: 'title v1 en',
        },
        overrideAccess: true,
      })

      await payload.update({
        id: originalPost.id,
        collection: draftCollectionSlug,
        data: {
          _status: 'published',
          description: 'description v2',
          title: 'title v2 en',
        },
        draft: true,
        overrideAccess: true,
      })

      const versions = await payload.findVersions({
        collection: draftCollectionSlug,
        overrideAccess: true,
        where: {
          parent: {
            equals: originalPost.id,
          },
        },
      })

      const oldestVersion = versions.docs[versions.docs.length - 1]

      const restoredVersion = await payload.restoreVersion({
        id: oldestVersion!.id,
        collection: draftCollectionSlug,
        fallbackLocale: false,
        locale: 'de',
        overrideAccess: true,
      })

      expect(restoredVersion.id).toStrictEqual(originalPost.id)
    })

    test('findVersions - pagination should work correctly', async ({ payload }) => {
      const post = await payload.create({
        collection: draftCollectionSlug,
        data: { description: 'a', title: 'title' },
        overrideAccess: true,
      })
      for (let i = 0; i < 100; i++) {
        await payload.update({
          id: post.id,
          collection: draftCollectionSlug,
          data: {},
          overrideAccess: true,
        })
      }
      const res = await payload.findVersions({
        collection: draftCollectionSlug,
        overrideAccess: true,
        where: { parent: { equals: post.id } },
      })
      expect(res.totalDocs).toBe(101)
      expect(res.docs).toHaveLength(10)
      const resPaginationFalse = await payload.findVersions({
        collection: draftCollectionSlug,
        overrideAccess: true,
        pagination: false,
        where: { parent: { equals: post.id } },
      })

      expect(resPaginationFalse.docs).toHaveLength(101)
      expect(resPaginationFalse.totalDocs).toBe(101)

      const resPaginationFalseLimit0 = await payload.findVersions({
        collection: draftCollectionSlug,
        limit: 0,
        overrideAccess: true,
        pagination: false,
        where: { parent: { equals: post.id } },
      })
      expect(resPaginationFalseLimit0.docs).toHaveLength(101)
      expect(resPaginationFalseLimit0.totalDocs).toBe(101)
    })

    test.describe('Update', () => {
      test.afterEach(async ({ payload }) => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug, autosaveCollectionSlug],
          payload,
        })
      })

      test('should allow a draft to be patched', async ({ payload }) => {
        const originalTitle = 'Here is a published post'

        const originalPublishedPost = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            _status: 'published',
            description: 'kjnjyhbbdsfseankuhsjsfghb',
            title: originalTitle,
          },
          overrideAccess: true,
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
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const publishedPost = await payload.findByID({
          id: originalPublishedPost.id,
          collection: autosaveCollectionSlug,
          overrideAccess: true,
        })

        const draftPost = await payload.findByID({
          id: originalPublishedPost.id,
          collection: autosaveCollectionSlug,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })

        expect(publishedPost.title).toBe(originalTitle)
        expect(draftPost.title.en).toBe(patchedTitle)
        expect(draftPost.title.es).toBe(spanishTitle)
      })

      test('should have correct updatedAt timestamps when saving drafts', async ({ payload }) => {
        const created = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'desc',
            title: 'title',
          },
          draft: true,
          overrideAccess: true,
        })

        await wait(10)

        const updated = await payload.update({
          id: created.id,
          collection: draftCollectionSlug,
          data: {
            title: 'updated title',
          },
          draft: true,
          overrideAccess: true,
        })

        const createdUpdatedAt = new Date(created.updatedAt)
        const updatedUpdatedAt = new Date(updated.updatedAt)

        expect(Number(updatedUpdatedAt)).toBeGreaterThan(Number(createdUpdatedAt))
      })

      test('should have correct updatedAt timestamps when saving drafts with autosave', async ({
        payload,
      }) => {
        const created = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'desc',
            title: 'title',
          },
          draft: true,
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const createdUpdatedAt = new Date(created.updatedAt)
        const updatedUpdatedAt = new Date(updated.updatedAt)

        expect(Number(updatedUpdatedAt)).toBeGreaterThan(Number(createdUpdatedAt))
      })

      test('should update correct version at doc that has hasMany field when saving with autosave', async ({
        payload,
      }) => {
        const firstDocTag: AutosaveMultiSelectPost['tag'] = ['blog', 'essay']
        const doc = await payload.create({
          collection: autosaveWithMultiSelectCollectionSlug,
          data: {
            _status: 'published',
            tag: firstDocTag,
            title: 'title 1',
          },
          draft: false,
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const doc2 = await payload.create({
          collection: autosaveWithMultiSelectCollectionSlug,
          data: {
            _status: 'published',
            tag: ['blog'],
            title: 'title 1-2',
          },
          draft: false,
          overrideAccess: true,
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
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const lastDocVersion = await payload.findVersions({
          collection: autosaveWithMultiSelectCollectionSlug,
          limit: 1,
          overrideAccess: true,
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

      test('should save draft with hasMany select nested two array levels deep', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: nestedArraySelectCollectionSlug,
          data: {},
          overrideAccess: true,
        })

        const updated = await payload.update({
          id: doc.id,
          collection: nestedArraySelectCollectionSlug,
          data: {
            outer: [{ inner: [{ days: ['monday'] }] }],
          },
          draft: true,
          overrideAccess: true,
        })

        expect(updated.outer?.[0]?.inner?.[0]?.days).toEqual(['monday'])

        await cleanupDocuments({
          collectionSlugs: [nestedArraySelectCollectionSlug],
          payload,
        })
      })

      test('should validate when publishing with the draft arg', async ({ payload }) => {
        // no title (not valid for publishing)
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'desc',
          },
          draft: true,
          overrideAccess: true,
        })

        await expect(
          payload.update({
            id: doc.id,
            collection: draftCollectionSlug,
            data: { _status: 'published' },
            draft: true,
            overrideAccess: true,
          }),
        ).rejects.toThrow(ValidationError)

        // succeeds but returns zero docs updated, with an error
        const updateManyResult = await payload.update({
          collection: draftCollectionSlug,
          data: { _status: 'published' },
          draft: true,
          overrideAccess: true,
          where: {
            id: { equals: doc.id },
          },
        })

        expect(updateManyResult.docs).toHaveLength(0)
        expect(updateManyResult.errors).toStrictEqual([
          { id: doc.id, isPublic: true, message: 'The following field is invalid: Group > Title' },
        ])
      })

      test('should update with autosave: true', async ({ payload }) => {
        // Save a draft
        const { id } = await payload.create({
          collection: autosaveCollectionSlug,
          data: { _status: 'draft', description: 'some-description', title: 'my-title' },
          draft: true,
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const versionsCount = await payload.countVersions({
          collection: autosaveCollectionSlug,
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const versionsCountAfter = await payload.countVersions({
          collection: autosaveCollectionSlug,
          overrideAccess: true,
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

    test.describe('Update Many', () => {
      test.afterEach(async ({ payload }) => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug],
          payload,
        })
      })

      test('should update many using drafts', async ({ payload }) => {
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'published',
            description: 'description to bulk update',
            title: 'initial value',
          },
          overrideAccess: true,
        })

        await payload.update({
          id: doc.id,
          collection: draftCollectionSlug,
          data: {
            title: 'updated title',
          },
          draft: true,
          overrideAccess: true,
        })

        // bulk publish
        const updated = await payload.update({
          collection: draftCollectionSlug,
          data: {
            _status: 'published',
            description: 'updated description',
          },
          draft: true,
          overrideAccess: true,
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
          overrideAccess: true,
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

    test.describe('Delete', () => {
      test('should delete drafts', async ({ payload }) => {
        const postToDelete = await payload.create({
          collection: autosaveCollectionSlug,
          data: {
            _status: 'draft',
            description: 'description',
            title: 'title to delete',
          },
          overrideAccess: true,
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
          overrideAccess: true,
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

    test.describe('Draft Count', () => {
      test.afterEach(async ({ payload }) => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug],
          payload,
        })
      })

      test('creates proper number of drafts', async ({ payload }) => {
        const originalDraft = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'draft',
            description: 'A',
            title: 'A',
          },
          draft: true,
          overrideAccess: true,
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
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const mostRecentDraft = await payload.findByID({
          id: originalDraft.id,
          collection: draftCollectionSlug,
          draft: true,
          overrideAccess: true,
        })

        expect(mostRecentDraft.title).toStrictEqual('C')

        const versions = await payload.findVersions({
          collection: draftCollectionSlug,
          overrideAccess: true,
          where: {
            parent: {
              equals: originalDraft.id,
            },
          },
        })

        expect(versions.docs).toHaveLength(3)
      })
    })

    test.describe('Unpublish', () => {
      test.afterEach(async ({ payload }) => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug],
          payload,
        })
      })

      test('should not create a new version when unpublishing a collection document', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'published',
            description: 'test',
            title: 'unpublish test',
          },
          overrideAccess: true,
        })

        const initialVersions = await payload.findVersions({
          collection: draftCollectionSlug,
          overrideAccess: true,
          where: { parent: { equals: doc.id } },
        })

        expect(initialVersions.docs).toHaveLength(1)
        expect(initialVersions.docs[0].version._status).toBe('published')

        const unpublished = await payload.update({
          id: doc.id,
          collection: draftCollectionSlug,
          data: { _status: 'draft' },
          overrideAccess: true,
          unpublishAllLocales: true,
        })

        expect(unpublished._status).toBe('draft')

        const afterVersions = await payload.findVersions({
          collection: draftCollectionSlug,
          overrideAccess: true,
          where: { parent: { equals: doc.id } },
        })

        expect(afterVersions.docs).toHaveLength(1)
        expect(afterVersions.docs[0].version._status).toBe('draft')
      })

      test('should not create a new version when unpublishing a global', async ({ payload }) => {
        await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: { _status: 'published', title: 'unpublish global test' },
          overrideAccess: true,
        })

        const initialVersions = await payload.findGlobalVersions({
          slug: draftGlobalSlug,
          overrideAccess: true,
        })

        const initialCount = initialVersions.docs.length

        await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: { _status: 'draft' },
          overrideAccess: true,
          unpublishAllLocales: true,
        })

        const afterVersions = await payload.findGlobalVersions({
          slug: draftGlobalSlug,
          overrideAccess: true,
        })

        expect(afterVersions.docs).toHaveLength(initialCount)
        expect(afterVersions.docs[0].version._status).toBe('draft')

        await cleanupGlobal({ globalSlug: draftGlobalSlug, payload })
      })

      test('should update main table _status to draft when unpublishing', async ({ payload }) => {
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'published',
            description: 'test',
            title: 'main table unpublish test',
          },
          overrideAccess: true,
        })

        await payload.update({
          id: doc.id,
          collection: draftCollectionSlug,
          data: { _status: 'draft' },
          overrideAccess: true,
          unpublishAllLocales: true,
        })

        const found = await payload.findByID({
          id: doc.id,
          collection: draftCollectionSlug,
          draft: false,
          overrideAccess: true,
        })

        expect(found._status).toBe('draft')
      })

      test('should unpublish a collection document with localized required fields from a non-default locale', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'published',
            description: 'test',
            title: 'unpublish localized test',
          },
          locale: 'en',
          overrideAccess: true,
        })

        const unpublished = await payload.update({
          id: doc.id,
          collection: draftCollectionSlug,
          data: { _status: 'draft' },
          locale: 'es',
          overrideAccess: true,
          unpublishAllLocales: true,
        })

        expect(unpublished._status).toBe('draft')

        await payload.delete({ id: doc.id, collection: draftCollectionSlug, overrideAccess: true })
      })

      test('should unpublish a global with localized required fields from a non-default locale', async ({
        payload,
      }) => {
        await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: { _status: 'published', title: 'unpublish global localized test' },
          locale: 'en',
          overrideAccess: true,
        })

        const unpublished = await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: { _status: 'draft' },
          fallbackLocale: false,
          locale: 'es',
          overrideAccess: true,
          unpublishAllLocales: true,
        })

        expect(unpublished._status).toBe('draft')

        await cleanupGlobal({ globalSlug: draftGlobalSlug, payload })
      })

      test('should validate submitted collection fields when unpublishing', async ({ payload }) => {
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'published',
            description: 'Valid description',
            title: 'Validate collection unpublish',
          },
          overrideAccess: true,
        })

        try {
          await expect(
            payload.update({
              id: doc.id,
              collection: draftCollectionSlug,
              data: {
                _status: 'draft',
                description: '',
              },
              overrideAccess: true,
              unpublishAllLocales: true,
            }),
          ).rejects.toThrow(ValidationError)
        } finally {
          await payload.delete({
            id: doc.id,
            collection: draftCollectionSlug,
            overrideAccess: true,
          })
        }
      })

      test('should validate submitted dotted field paths when unpublishing', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: errorOnUnpublishSlug,
          data: {
            _status: 'published',
            group: {
              textInGroup: 'Valid nested value',
            },
            title: 'Validate nested collection unpublish',
          },
          overrideAccess: true,
        })

        try {
          await expect(
            payload.update({
              id: doc.id,
              collection: errorOnUnpublishSlug,
              data: {
                _status: 'draft',
                // @ts-expect-error dotted field paths are accepted at runtime
                'group.textInGroup': '',
              },
              overrideAccess: true,
              unpublishAllLocales: true,
            }),
          ).rejects.toThrow(ValidationError)
        } finally {
          await payload.delete({
            id: doc.id,
            collection: errorOnUnpublishSlug,
            overrideAccess: true,
          })
        }
      })

      test('should validate submitted global fields when unpublishing', async ({ payload }) => {
        await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: {
            _status: 'published',
            title: 'Validate global unpublish',
          },
          overrideAccess: true,
        })

        try {
          await expect(
            payload.updateGlobal({
              slug: draftGlobalSlug,
              data: {
                _status: 'draft',
                title: '',
              },
              overrideAccess: true,
              unpublishAllLocales: true,
            }),
          ).rejects.toThrow(ValidationError)
        } finally {
          await cleanupGlobal({ globalSlug: draftGlobalSlug, payload })
        }
      })
    })

    test.describe('Draft Types', () => {
      test.afterEach(async ({ payload }) => {
        await cleanupDocuments({
          collectionSlugs: [draftCollectionSlug],
          payload,
        })
      })

      test('should allow creating drafts without required fields', async ({ payload }) => {
        // This test validates that when draft: true is set, required fields become optional
        // TypeScript should not complain about missing 'description' field even though it's required
        const draft = await payload.create({
          collection: draftCollectionSlug,
          data: {
            title: 'Draft without description',
            // description is required but omitted - should work with draft: true
          },
          draft: true,
          overrideAccess: true,
        })

        expect(draft.title).toBe('Draft without description')
        // Different databases return null vs undefined for missing fields
        expect(draft.description).toBeFalsy()
        expect(draft._status).toBe('draft')
      })

      test('should require all required fields when draft is false', async ({ payload }) => {
        // This validates that required fields are still enforced when draft is false
        await expect(
          // @ts-expect-error - description is required when not creating a draft
          payload.create({
            collection: draftCollectionSlug,
            data: {
              title: 'Published without description',
            },
            draft: false,
            overrideAccess: true,
          }),
        ).rejects.toThrow(ValidationError)
      })

      test('should require all required fields when draft is not specified', async ({
        payload,
      }) => {
        // This validates that required fields are still enforced when draft option is omitted
        await expect(
          // @ts-expect-error - description is required when draft option is not specified
          payload.create({
            collection: draftCollectionSlug,
            data: {
              title: 'Post without description',
            },
            overrideAccess: true,
          }),
        ).rejects.toThrow(ValidationError)
      })

      test('should allow all fields to be optional with draft: true', async ({ payload }) => {
        // Test that even fields nested in groups can be omitted
        const draft = await payload.create({
          collection: draftCollectionSlug,
          data: {
            // Both title and description are required but omitted
          },
          draft: true,
          overrideAccess: true,
        })

        expect(draft._status).toBe('draft')
        // Different databases return null vs undefined for missing fields
        expect(draft.title).toBeFalsy()
        expect(draft.description).toBeFalsy()
      })
    })

    test.describe('Max Versions', () => {
      // create 2 documents with 3 versions each
      // expect 2 documents with 2 versions each
      test('retains correct versions', async ({ payload }) => {
        // doc1 - v1
        const doc1 = await payload.create({
          collection: versionCollectionSlug,
          data: {
            description: 'A',
            title: 'A',
          },
          overrideAccess: true,
        })
        // v2
        await payload.update({
          id: doc1.id,
          collection: versionCollectionSlug,
          data: {
            description: 'B',
            title: 'B',
          },
          overrideAccess: true,
        })
        // v3
        await payload.update({
          id: doc1.id,
          collection: versionCollectionSlug,
          data: {
            description: 'C',
            title: 'C',
          },
          overrideAccess: true,
        })

        // doc2 - v1
        const doc2 = await payload.create({
          collection: versionCollectionSlug,
          data: {
            description: 'D',
            title: 'D',
          },
          overrideAccess: true,
        })
        // v2
        await payload.update({
          id: doc2.id,
          collection: versionCollectionSlug,
          data: {
            description: 'E',
            title: 'E',
          },
          overrideAccess: true,
        })
        // v3
        await payload.update({
          id: doc2.id,
          collection: versionCollectionSlug,
          data: {
            description: 'F',
            title: 'F',
          },
          overrideAccess: true,
        })

        const doc1Versions = await payload.findVersions({
          collection: versionCollectionSlug,
          overrideAccess: true,
          sort: '-updatedAt',
          where: {
            parent: {
              equals: doc1.id,
            },
          },
        })

        const doc2Versions = await payload.findVersions({
          collection: versionCollectionSlug,
          overrideAccess: true,
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
          overrideAccess: true,
        })

        // correctly retains 2 documents in the actual collection
        expect(docs.totalDocs).toStrictEqual(2)

        await cleanupDocuments({
          collectionSlugs: [versionCollectionSlug],
          payload,
        })
      })
    })

    test.describe('Race conditions', () => {
      test('should keep latest true with parallel writes', async ({ payload }) => {
        const doc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'A',
            title: 'A',
          },
          overrideAccess: true,
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
                  overrideAccess: true,
                })
                .then(resolve)
                .catch(resolve)
            }, i * 5)
          })
        })

        await Promise.all(promises)

        const { docs } = await payload.findVersions({
          collection: draftCollectionSlug,
          overrideAccess: true,
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

      test('should fall back to creating a new version when updateVersion fails due to a concurrent write', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: autosaveCollectionSlug,
          data: { _status: 'draft', title: 'original' },
          draft: true,
          overrideAccess: true,
        })

        // Establish an existing autosave version so updateLatestVersion has something to update
        await payload.update({
          id: doc.id,
          autosave: true,
          collection: autosaveCollectionSlug,
          data: { title: 'first autosave' },
          draft: true,
          overrideAccess: true,
        })

        const spy = vi
          .spyOn(payload.db, 'updateVersion')
          .mockRejectedValueOnce(new Error('concurrent update conflict'))

        // Should not throw — updateLatestVersion catches the error and saveVersion falls back to createVersion
        const result = await payload.update({
          id: doc.id,
          autosave: true,
          collection: autosaveCollectionSlug,
          data: { title: 'second autosave' },
          draft: true,
          overrideAccess: true,
        })

        spy.mockRestore()

        expect(result.title).toBe('second autosave')

        // A new version was created as fallback instead of the in-place update
        const { totalDocs } = await payload.countVersions({
          collection: autosaveCollectionSlug,
          overrideAccess: true,
          where: { parent: { equals: doc.id } },
        })

        // create → 1 version, first autosave updates in place → still 1 version on autosave collection (it creates a new autosave),
        // second autosave failed update → fell back to create → one extra version
        expect(totalDocs).toBeGreaterThan(1)

        await cleanupDocuments({
          collectionSlugs: [autosaveCollectionSlug],
          payload,
        })
      })

      test('should propagate the error when createVersion also fails', async ({ payload }) => {
        const doc = await payload.create({
          collection: autosaveCollectionSlug,
          data: { _status: 'draft', title: 'original' },
          draft: true,
          overrideAccess: true,
        })

        const updateVersionSpy = vi
          .spyOn(payload.db, 'updateVersion')
          .mockRejectedValueOnce(new Error('concurrent update conflict'))
        const createVersionSpy = vi
          .spyOn(payload.db, 'createVersion')
          .mockRejectedValueOnce(new Error('database connection lost'))

        await expect(
          payload.update({
            id: doc.id,
            autosave: true,
            collection: autosaveCollectionSlug,
            data: { title: 'will fail' },
            draft: true,
            overrideAccess: true,
          }),
        ).rejects.toThrow('database connection lost')

        updateVersionSpy.mockRestore()
        createVersionSpy.mockRestore()

        await cleanupDocuments({
          collectionSlugs: [autosaveCollectionSlug],
          payload,
        })
      })
    })
  })

  test.describe('Upload Collections with Drafts', () => {
    const uploadedFilenames: string[] = []
    const uploadStaticDir = path.resolve(dirname, './collections/uploads-draft')

    test.afterEach(async ({ payload }) => {
      await cleanupDocuments({
        collectionSlugs: [draftWithUploadCollectionSlug],
        payload,
      })

      for (const filename of uploadedFilenames) {
        const filePath = path.resolve(uploadStaticDir, filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
      uploadedFilenames.length = 0
    })

    test('should not modify the published document when saving a draft with a new file', async ({
      payload,
    }) => {
      const imageFile = await getFileByPath(path.resolve(dirname, './image.jpg'))

      imageFile.name = 'original-published.jpg'

      const publishedDoc = await payload.create({
        collection: draftWithUploadCollectionSlug,
        data: {
          _status: 'published',
          alt: 'Original image',
        },
        file: imageFile,
        overrideAccess: true,
      })

      uploadedFilenames.push(publishedDoc.filename)
      expect(publishedDoc._status).toBe('published')

      const draftImageFile = await getFileByPath(path.resolve(dirname, './image.png'))

      draftImageFile.name = 'new-draft-file.png'

      await payload.update({
        id: publishedDoc.id,
        collection: draftWithUploadCollectionSlug,
        data: {
          _status: 'draft',
          alt: 'Updated in draft',
        },
        draft: true,
        file: draftImageFile,
        overrideAccess: true,
      })

      const mainDoc = await payload.findByID({
        id: publishedDoc.id,
        collection: draftWithUploadCollectionSlug,
        overrideAccess: true,
      })

      const draftDoc = await payload.findByID({
        id: publishedDoc.id,
        collection: draftWithUploadCollectionSlug,
        draft: true,
        overrideAccess: true,
      })

      uploadedFilenames.push(draftDoc.filename)

      expect(mainDoc._status).toBe('published')
      expect(mainDoc.filename).toBe(publishedDoc.filename)
      expect(mainDoc.alt).toBe('Original image')

      expect(draftDoc._status).toBe('draft')
      expect(draftDoc.alt).toBe('Updated in draft')
      expect(draftDoc.filename).not.toBe(publishedDoc.filename)
    })

    test('should not delete the published file from disk when saving a draft with a new file', async ({
      payload,
    }) => {
      const imageFile = await getFileByPath(path.resolve(dirname, './image.jpg'))

      imageFile.name = 'published-file-disk-check.jpg'

      const publishedDoc = await payload.create({
        collection: draftWithUploadCollectionSlug,
        data: {
          _status: 'published',
          alt: 'Published image',
        },
        file: imageFile,
        overrideAccess: true,
      })

      uploadedFilenames.push(publishedDoc.filename)

      const publishedFilePath = path.resolve(uploadStaticDir, publishedDoc.filename)

      expect(fs.existsSync(publishedFilePath)).toBe(true)

      const draftImageFile = await getFileByPath(path.resolve(dirname, './image.png'))

      draftImageFile.name = 'replacement-draft-file.png'

      await payload.update({
        id: publishedDoc.id,
        collection: draftWithUploadCollectionSlug,
        data: {
          _status: 'draft',
          alt: 'Draft with new file',
        },
        draft: true,
        file: draftImageFile,
        overrideAccess: true,
      })

      const draftDoc = await payload.findByID({
        id: publishedDoc.id,
        collection: draftWithUploadCollectionSlug,
        draft: true,
        overrideAccess: true,
      })

      uploadedFilenames.push(draftDoc.filename)

      expect(fs.existsSync(publishedFilePath)).toBe(true)
    })

    test('should correctly publish a draft with a new file using the PublishMany pattern', async ({
      payload,
    }) => {
      const imageFile = await getFileByPath(path.resolve(dirname, './image.jpg'))

      imageFile.name = 'publish-many-original.jpg'

      const publishedDoc = await payload.create({
        collection: draftWithUploadCollectionSlug,
        data: {
          _status: 'published',
          alt: 'Original',
        },
        file: imageFile,
        overrideAccess: true,
      })

      uploadedFilenames.push(publishedDoc.filename)

      const draftImageFile = await getFileByPath(path.resolve(dirname, './image.png'))

      draftImageFile.name = 'publish-many-draft.png'

      await payload.update({
        id: publishedDoc.id,
        collection: draftWithUploadCollectionSlug,
        data: {
          _status: 'draft',
          alt: 'Draft version',
        },
        draft: true,
        file: draftImageFile,
        overrideAccess: true,
      })

      const draftDoc = await payload.findByID({
        id: publishedDoc.id,
        collection: draftWithUploadCollectionSlug,
        draft: true,
        overrideAccess: true,
      })

      uploadedFilenames.push(draftDoc.filename)

      await payload.update({
        collection: draftWithUploadCollectionSlug,
        data: {
          _status: 'published',
        },
        draft: true,
        overrideAccess: true,
        where: {
          id: { equals: publishedDoc.id },
        },
      })

      const republishedDoc = await payload.findByID({
        id: publishedDoc.id,
        collection: draftWithUploadCollectionSlug,
        overrideAccess: true,
      })

      expect(republishedDoc._status).toBe('published')
      expect(republishedDoc.filename).toBe(draftDoc.filename)
      expect(republishedDoc.alt).toBe('Draft version')
    })

    test('should create a draft when duplicating a published upload document with draft: true', async ({
      payload,
    }) => {
      const imageFile = await getFileByPath(path.resolve(dirname, './image.jpg'))

      imageFile.name = 'duplicate-source.jpg'

      const publishedDoc = await payload.create({
        collection: draftWithUploadCollectionSlug,
        data: {
          _status: 'published',
          alt: 'Original published',
        },
        file: imageFile,
        overrideAccess: true,
      })

      uploadedFilenames.push(publishedDoc.filename)
      expect(publishedDoc._status).toBe('published')

      const duplicatedDoc = await payload.create({
        collection: draftWithUploadCollectionSlug,
        data: {
          alt: 'Duplicated draft',
        },
        draft: true,
        duplicateFromID: publishedDoc.id,
        overrideAccess: true,
      })

      uploadedFilenames.push(duplicatedDoc.filename)

      expect(duplicatedDoc._status).toBe('draft')
    })
  })

  test.describe('Upload Collections with Drafts (cloud storage)', () => {
    test.afterEach(async ({ payload }) => {
      await cleanupDocuments({
        collectionSlugs: [draftWithUploadCloudStorageCollectionSlug],
        payload,
      })
      cloudStorageDeletedFilenames.length = 0
    })

    test('should not unpublish the main document when saving a draft with a new file', async ({
      payload,
    }) => {
      const imageFile = await getFileByPath(path.resolve(dirname, './image.jpg'))

      imageFile.name = 'cloud-original-published.jpg'

      const publishedDoc = await payload.create({
        collection: draftWithUploadCloudStorageCollectionSlug,
        data: {
          _status: 'published',
          alt: 'Original image',
        },
        file: imageFile,
        overrideAccess: true,
      })

      expect(publishedDoc._status).toBe('published')

      const draftImageFile = await getFileByPath(path.resolve(dirname, './image.png'))

      draftImageFile.name = 'cloud-new-draft-file.png'

      await payload.update({
        id: publishedDoc.id,
        collection: draftWithUploadCloudStorageCollectionSlug,
        data: {
          _status: 'draft',
          alt: 'Updated in draft',
        },
        draft: true,
        file: draftImageFile,
        overrideAccess: true,
      })

      const mainDoc = await payload.findByID({
        id: publishedDoc.id,
        collection: draftWithUploadCloudStorageCollectionSlug,
        overrideAccess: true,
      })

      const draftDoc = await payload.findByID({
        id: publishedDoc.id,
        collection: draftWithUploadCloudStorageCollectionSlug,
        draft: true,
        overrideAccess: true,
      })

      expect(mainDoc._status).toBe('published')
      expect(mainDoc.filename).toBe(publishedDoc.filename)
      expect(mainDoc.alt).toBe('Original image')

      expect(draftDoc._status).toBe('draft')
      expect(draftDoc.alt).toBe('Updated in draft')
      expect(draftDoc.filename).not.toBe(publishedDoc.filename)
    })

    test('should not delete the published file when saving a draft with a new file', async ({
      payload,
    }) => {
      const imageFile = await getFileByPath(path.resolve(dirname, './image.jpg'))

      imageFile.name = 'cloud-delete-published.jpg'

      const publishedDoc = await payload.create({
        collection: draftWithUploadCloudStorageCollectionSlug,
        data: {
          _status: 'published',
          alt: 'Original image',
        },
        file: imageFile,
        overrideAccess: true,
      })

      const draftImageFile = await getFileByPath(path.resolve(dirname, './image.png'))

      draftImageFile.name = 'cloud-delete-draft.png'

      await payload.update({
        id: publishedDoc.id,
        collection: draftWithUploadCloudStorageCollectionSlug,
        data: {
          _status: 'draft',
          alt: 'Updated in draft',
        },
        draft: true,
        file: draftImageFile,
        overrideAccess: true,
      })

      expect(cloudStorageDeletedFilenames).not.toContain(publishedDoc.filename)
    })

    test('should publish the draft file when the draft is later published', async ({ payload }) => {
      const imageFile = await getFileByPath(path.resolve(dirname, './image.jpg'))

      imageFile.name = 'cloud-publish-original.jpg'

      const publishedDoc = await payload.create({
        collection: draftWithUploadCloudStorageCollectionSlug,
        data: {
          _status: 'published',
          alt: 'Original',
        },
        file: imageFile,
        overrideAccess: true,
      })

      const draftImageFile = await getFileByPath(path.resolve(dirname, './image.png'))

      draftImageFile.name = 'cloud-publish-draft.png'

      await payload.update({
        id: publishedDoc.id,
        collection: draftWithUploadCloudStorageCollectionSlug,
        data: {
          _status: 'draft',
          alt: 'Draft version',
        },
        draft: true,
        file: draftImageFile,
        overrideAccess: true,
      })

      const draftDoc = await payload.findByID({
        id: publishedDoc.id,
        collection: draftWithUploadCloudStorageCollectionSlug,
        draft: true,
        overrideAccess: true,
      })

      const republishedDoc = await payload.update({
        id: publishedDoc.id,
        collection: draftWithUploadCloudStorageCollectionSlug,
        data: {
          _status: 'published',
        },
        draft: true,
        overrideAccess: true,
      })

      expect(republishedDoc._status).toBe('published')
      expect(republishedDoc.filename).toBe(draftDoc.filename)
      expect(republishedDoc.alt).toBe('Draft version')
    })

    test('should persist adapter metadata to the main document on a non-draft update', async ({
      payload,
    }) => {
      const imageFile = await getFileByPath(path.resolve(dirname, './image.jpg'))

      imageFile.name = 'cloud-normal-original.jpg'

      const publishedDoc = await payload.create({
        collection: draftWithUploadCloudStorageCollectionSlug,
        data: {
          _status: 'published',
          alt: 'Original',
        },
        file: imageFile,
        overrideAccess: true,
      })

      const newFile = await getFileByPath(path.resolve(dirname, './image.png'))

      newFile.name = 'cloud-normal-replacement.png'

      const updated = await payload.update({
        id: publishedDoc.id,
        collection: draftWithUploadCloudStorageCollectionSlug,
        data: {
          _status: 'published',
          alt: 'Replaced',
        },
        file: newFile,
        overrideAccess: true,
      })

      const mainDoc = await payload.findByID({
        id: publishedDoc.id,
        collection: draftWithUploadCloudStorageCollectionSlug,
        overrideAccess: true,
      })

      expect(mainDoc._status).toBe('published')
      expect(mainDoc.alt).toBe('Replaced')
      expect(mainDoc.filename).toBe(updated.filename)
    })
  })

  test.describe('Querying', () => {
    const originalTitle = 'original title'
    const updatedTitle1 = 'new title 1'
    const updatedTitle2 = 'new title 2'
    let firstDraft

    async function createPostWithVersions(
      { payload }: { payload: Payload },
      args?: { title?: string },
    ) {
      firstDraft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'my description',
          radio: 'test',
          title: args?.title || originalTitle,
        },
        overrideAccess: true,
      })

      // This will be created in the `_draft-posts_versions` collection
      await payload.update({
        id: firstDraft.id,
        collection: draftCollectionSlug,
        data: {
          title: updatedTitle1,
        },
        draft: true,
        overrideAccess: true,
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
        overrideAccess: true,
      })
    }

    test.beforeEach(async ({ payload }) => {
      await createPostWithVersions({ payload })
    })

    test.afterEach(async ({ payload }) => {
      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug],
        payload,
      })
    })

    test('should allow querying a draft doc from main collection', async ({ payload }) => {
      const findResults = await payload.find({
        collection: draftCollectionSlug,
        overrideAccess: true,
        where: {
          title: {
            equals: originalTitle,
          },
        },
      })

      expect(findResults.docs[0].title).toStrictEqual(originalTitle)
    })

    test('should return more than 10 `totalDocs`', async ({ payload }) => {
      const { id } = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'Description',
          title: 'Title',
        },
        overrideAccess: true,
      })

      const createVersions = async (int: number = 1) => {
        for (let i = 0; i < int; i++) {
          await payload.update({
            id,
            collection: draftCollectionSlug,
            data: {
              title: `Title ${i}`,
            },
            overrideAccess: true,
          })
        }
      }

      await createVersions(10)

      const findResults = await payload.findVersions({
        collection: draftCollectionSlug,
        overrideAccess: true,
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

    test('should not be able to query an old draft version with draft=true', async ({
      payload,
    }) => {
      const draftFindResults = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        overrideAccess: true,
        where: {
          title: {
            equals: updatedTitle1,
          },
        },
      })

      expect(draftFindResults.docs).toHaveLength(0)
    })

    test('should be able to query the newest draft version with draft=true', async ({
      payload,
    }) => {
      const draftFindResults = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        overrideAccess: true,
        where: {
          title: {
            equals: updatedTitle2,
          },
        },
      })

      expect(draftFindResults.docs[0].title).toStrictEqual(updatedTitle2)
    })

    test('should be able to query blockType fields with contains and draft=true', async ({
      payload,
    }) => {
      const matchingDraft = await createDraftDocument({
        blocksField: [
          {
            blockType: 'block',
            localized: null,
            text: 'Block',
          },
        ],
        collection: draftCollectionSlug,
        payload,
        title: 'draft block type query',
      })

      await createDraftDocument({
        blocksField: [],
        collection: draftCollectionSlug,
        payload,
        title: 'draft block type query 2',
      })

      const query = {
        'blocksField.blockType': {
          contains: 'block',
        },
      }

      const publishedFindResults = await payload.find({
        collection: draftCollectionSlug,
        overrideAccess: true,
        where: query,
      })

      expect(publishedFindResults.docs).toHaveLength(1)
      expect(publishedFindResults.docs.find(({ id }) => id === matchingDraft.id)).toBeDefined()

      const draftFindResults = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        overrideAccess: true,
        where: query,
      })

      expect(draftFindResults.docs).toHaveLength(1)
      expect(draftFindResults.docs.find(({ id }) => id === matchingDraft.id)).toBeDefined()
    })

    test("should not be able to query old drafts that don't match with draft=true", async ({
      payload,
    }) => {
      const draftFindResults = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        overrideAccess: true,
        where: {
          title: {
            equals: originalTitle,
          },
        },
      })

      expect(draftFindResults.docs).toHaveLength(0)
    })

    test('should be able to query by id with draft=true', async ({ payload }) => {
      await createPostWithVersions({ payload }, { title: 'different document' })
      const allDocs = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        overrideAccess: true,
      })

      expect(allDocs.docs).toHaveLength(2)

      const byID = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        overrideAccess: true,
        where: {
          id: {
            equals: firstDraft.id,
          },
        },
      })

      expect(byID.docs).toHaveLength(1)
    })

    test('should be able to query by id AND any other field with draft=true', async ({
      payload,
    }) => {
      await createPostWithVersions({ payload }, { title: 'title document 2' })
      const allDocs = await payload.find({
        collection: draftCollectionSlug,
        draft: true,
        overrideAccess: true,
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
        overrideAccess: true,
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

  test.describe('Collections - GraphQL', () => {
    async function createAutoSavePostHelper(
      { restClient }: { restClient: NextRESTClient },
      {
        description,
        title,
      }: {
        description: string
        title: string
      },
    ): Promise<JsonObject> {
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

    async function updateAutoSavePostHelper(
      { payload }: { payload: Payload },
      { restClient }: { restClient: NextRESTClient },
      {
        id,
        title,
      }: {
        id: number | string
        title: string
      },
    ): Promise<JsonObject> {
      const query = `mutation {
          updateAutosavePost(id: ${formatGraphQLID({ payload }, id)}, data: {title: "${title}"}) {
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

    async function getVersionByIDHelper(
      { payload }: { payload: Payload },
      { restClient }: { restClient: NextRESTClient },
      { id }: { id: number | string },
    ): Promise<JsonObject> {
      const query = `query {
          versionAutosavePost(id: ${formatGraphQLID({ payload }, id)}) {
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

    async function getLatestVersionByParentIDHelper(
      { payload }: { payload: Payload },
      { restClient }: { restClient: NextRESTClient },
      {
        parentID,
      }: {
        parentID: number | string
      },
    ): Promise<JsonObject> {
      const query = `query {
          versionsAutosavePosts(where: { AND: [{ parent: { equals: ${formatGraphQLID({ payload }, parentID)} } }, { latest: { equals: true } }] }) {
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

    test.describe('Create', () => {
      test('should allow a new doc to be created with draft status', async ({ restClient }) => {
        const autosavePost = await createAutoSavePostHelper(
          { restClient },
          {
            description: 'other autosave description 2',
            title: 'Some other title 2',
          },
        )

        expect(autosavePost._status).toStrictEqual('draft')
      })
    })

    test.describe('Read', () => {
      const updatedTitle2 = 'updated title'
      let localPostID: number | string

      test.beforeAll(async ({ payloadInstance: payload, restClientInstance: restClient }) => {
        const post = await createAutoSavePostHelper(
          { restClient },
          {
            description: 'local autosave description',
            title: collectionGraphQLOriginalTitle,
          },
        )
        localPostID = post.id
      })

      test.afterAll(async ({ payloadInstance }) => {
        await cleanupDocuments({
          collectionSlugs: [autosaveCollectionSlug],
          payload: payloadInstance,
        })
      })

      test('should allow read of versions by version id', async ({ payload, restClient }) => {
        await updateAutoSavePostHelper(
          { payload },
          { restClient },
          {
            id: localPostID,
            title: updatedTitle2,
          },
        )
        const latestVersion = await getLatestVersionByParentIDHelper(
          { payload },
          { restClient },
          {
            parentID: localPostID,
          },
        )
        const versionPost = await getVersionByIDHelper(
          { payload },
          { restClient },
          {
            id: latestVersion.id,
          },
        )

        expect(versionPost.id).toBeDefined()
        expect(versionPost.parent.id).toStrictEqual(localPostID)
        expect(versionPost.version.title).toStrictEqual(updatedTitle2)
      })

      test('should allow read of versions by querying version content', async ({ restClient }) => {
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

    test.describe('Restore', () => {
      let postID: number | string
      let versionID: number | string
      test.beforeAll(async ({ restClientInstance: restClient }) => {
        const autosavePost = await createAutoSavePostHelper(
          { restClient },
          {
            description: 'autosave description for restore',
            title: collectionGraphQLOriginalTitle,
          },
        )
        postID = autosavePost.id
      })

      test.beforeEach(async ({ payload, restClient }) => {
        // modify the post to create a new version
        // language=graphQL
        const update = `mutation {
          updateAutosavePost(id: ${formatGraphQLID(
            { payload },
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
          versionsAutosavePosts(where: { parent: { equals: ${formatGraphQLID({ payload }, postID)} } }) {
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

      test.afterAll(async ({ payloadInstance }) => {
        await cleanupDocuments({
          collectionSlugs: [autosaveCollectionSlug],
          payload: payloadInstance,
        })
      })

      test('should allow a version to be restored', async ({ payload, restClient }) => {
        // Update it
        const update = `mutation {
          updateAutosavePost(id: ${formatGraphQLID({ payload }, postID)}, data: {title: "${'Wrong title'}"}) {
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
          restoreVersionAutosavePost(id: ${formatGraphQLID({ payload }, versionID)}) {
            title
          }
        }`

        await restClient.GRAPHQL_POST({
          body: JSON.stringify({ query: restore }),
        })

        const query = `query {
          AutosavePost(id: ${formatGraphQLID({ payload }, postID)}) {
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

  test.describe('Collections - REST', () => {
    test('sholud query versions', async ({ payload, restClient }) => {
      // Create a post and update it to generate a version
      const autosavePost = await payload.create({
        collection: autosaveCollectionSlug,
        data: {
          description: 'test description',
          title: 'initial title',
        },
        overrideAccess: true,
      })

      await payload.update({
        id: autosavePost.id,
        collection: autosaveCollectionSlug,
        data: {
          title: 'updated title',
        },
        overrideAccess: true,
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

    test('should allow query by latest', async ({ payload, restClient }) => {
      async function createVersion({ title }: { title: string }) {
        return payload.create({
          collection: draftCollectionSlug,
          data: {
            description: 'Test Description',
            title,
          },
          overrideAccess: true,
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
          overrideAccess: true,
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

  test.describe('Globals - Local', () => {
    let globalVersionID: number | string
    test.beforeEach(async ({ payload }) => {
      const title2 = 'Here is an updated global title in EN'
      await payload.updateGlobal({
        slug: autoSaveGlobalSlug,
        data: {
          title: 'Test Global',
        },
        overrideAccess: true,
      })

      await payload.updateGlobal({
        slug: autoSaveGlobalSlug,
        data: {
          title: title2,
        },
        overrideAccess: true,
      })

      const versions = await payload.findGlobalVersions({
        slug: autoSaveGlobalSlug,
        overrideAccess: true,
      })

      globalVersionID = versions.docs[0]!.id
    })
    test.describe('Create', () => {
      test('should allow a new version to be created', async ({ payload }) => {
        const title2 = 'Here is an updated global title in EN'
        const updatedGlobal = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
          overrideAccess: true,
        })
        expect(updatedGlobal.title).toBe(title2)
        expect(updatedGlobal._status).toStrictEqual('draft')
        expect(globalVersionID).toBeDefined()
      })

      test('ensure global can be published after saving draft', async ({ payload }) => {
        const draftVersion = await payload.updateGlobal({
          slug: 'max-versions',
          data: {
            _status: 'draft',
            title: 'Draft',
          },
          draft: true,
          overrideAccess: true,
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
          overrideAccess: true,
        })
        expect(publishedVersion.title).toStrictEqual('Published')
        expect(publishedVersion._status).toStrictEqual('published')
      })

      test('should have different createdAt in a new version while the same version.createdAt', async ({
        payload,
      }) => {
        const doc = await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: { title: 'asd' },
          overrideAccess: true,
          publishAllLocales: true,
        })

        await wait(10)

        const upd = await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: { title: 'asd2' },
          overrideAccess: true,
          publishAllLocales: true,
        })

        expect(upd.createdAt).toBe(doc.createdAt)

        const {
          docs: [latestVersionData],
        } = await payload.findGlobalVersions({
          slug: autoSaveGlobalSlug,
          overrideAccess: true,
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
          overrideAccess: true,
        })

        // createdAt from non-versions should be the same as version_createdAt in versions
        expect(fromNonVersionsTable.createdAt).toBe(latestVersionData.version.createdAt)
        // When creating a new version - updatedAt should match
        expect(fromNonVersionsTable.updatedAt).toBe(latestVersionData.version.updatedAt)
      })
    })

    test('should properly clean up old versions when reached versions.max', async ({ payload }) => {
      const getLatestVersion = () =>
        payload
          .findGlobalVersions({
            slug: 'max-versions',
            limit: 1,
            overrideAccess: true,
            sort: '-createdAt',
          })
          .then((r) => r.docs[0])

      await payload.updateGlobal({
        slug: 'max-versions',
        data: { title: '1' },
        overrideAccess: true,
      })
      const version_1 = await getLatestVersion()
      await payload.updateGlobal({
        slug: 'max-versions',
        data: { title: '2' },
        overrideAccess: true,
      })
      await payload.updateGlobal({
        slug: 'max-versions',
        data: { title: '3' },
        overrideAccess: true,
      })
      const version_1_deleted = await payload.findGlobalVersionByID({
        id: version_1?.id as string,
        slug: 'max-versions',
        disableErrors: true,
        overrideAccess: true,
      })
      expect(version_1_deleted).toBeFalsy()
    })

    test('findGlobalVersions - pagination should work correctly', async ({ payload }) => {
      for (let i = 0; i < 100; i++) {
        await payload.updateGlobal({
          slug: 'draft-unlimited-global',
          data: { title: 'title' },
          overrideAccess: true,
        })
      }
      const res = await payload.findGlobalVersions({
        slug: 'draft-unlimited-global',
        overrideAccess: true,
      })
      expect(res.totalDocs).toBe(100)
      expect(res.docs).toHaveLength(10)
      const resPaginationFalse = await payload.findGlobalVersions({
        slug: 'draft-unlimited-global',
        overrideAccess: true,
        pagination: false,
      })
      expect(resPaginationFalse.docs).toHaveLength(100)
      expect(resPaginationFalse.totalDocs).toBe(100)

      const resPaginationFalseLimit0 = await payload.findGlobalVersions({
        slug: 'draft-unlimited-global',
        limit: 0,
        overrideAccess: true,
        pagination: false,
      })
      expect(resPaginationFalseLimit0.docs).toHaveLength(100)
      expect(resPaginationFalseLimit0.totalDocs).toBe(100)
    })

    test.describe('Read', () => {
      test('should reject invalid IDs before finding a global version', async ({ payload }) => {
        const invalidIDs: unknown[] = [
          undefined,
          null,
          '',
          Number.NaN,
          Number.POSITIVE_INFINITY,
          {},
        ]

        for (const invalidID of invalidIDs) {
          await expect(
            payload.findGlobalVersionByID({
              id: invalidID as string,
              slug: autoSaveGlobalSlug,
            }),
          ).rejects.toBeInstanceOf(NotFound)
        }
      })

      test('should allow a version to be retrieved by ID', async ({ payload }) => {
        const version = await payload.findGlobalVersionByID({
          id: globalVersionID,
          slug: autoSaveGlobalSlug,
          overrideAccess: true,
        })

        expect(version.id).toStrictEqual(globalVersionID)
      })

      test('should findGlobalVersions with limit: 0', async ({ payload }) => {
        await payload.db.deleteVersions({ globalSlug: draftUnlimitedGlobalSlug, where: {} })
        for (let i = 0; i < 100; i++) {
          await payload.updateGlobal({
            slug: draftUnlimitedGlobalSlug,
            data: { title: 'global' },
            overrideAccess: true,
          })
        }

        const res = await payload.findGlobalVersions({
          slug: draftUnlimitedGlobalSlug,
          limit: 0,
          overrideAccess: true,
        })

        expect(res.docs).toHaveLength(100)
      })
    })

    test.describe('Update', () => {
      test('should allow a version to save locales properly', async ({ payload }) => {
        const englishTitle = 'Title in EN'
        const spanishTitle = 'Title in ES'

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            title: englishTitle,
          },
          overrideAccess: true,
        })

        const updatedGlobalES = await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            title: spanishTitle,
          },
          locale: 'es',
          overrideAccess: true,
        })

        expect(updatedGlobalES.title).toBe(spanishTitle)

        const newEnglishTitle = 'New title in EN'

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            title: newEnglishTitle,
          },
          overrideAccess: true,
        })

        const versions = await payload.findGlobalVersions({
          slug: autoSaveGlobalSlug,
          locale: 'all',
          overrideAccess: true,
        })

        expect(versions.docs[0].version.title.en).toStrictEqual(newEnglishTitle)
        expect(versions.docs[0].version.title.es).toStrictEqual(spanishTitle)
      })

      test('should have correct updatedAt timestamps for globals when saving drafts', async ({
        payload,
      }) => {
        const created = await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: {
            title: 'title',
          },
          draft: true,
          overrideAccess: true,
        })

        await wait(10)

        const updated = await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: {
            title: 'updated title',
          },
          draft: true,
          overrideAccess: true,
        })

        const createdUpdatedAt = new Date(created.updatedAt)
        const updatedUpdatedAt = new Date(updated.updatedAt)

        expect(Number(updatedUpdatedAt)).toBeGreaterThan(Number(createdUpdatedAt))
      })

      test('should have correct updatedAt timestamps for globals when saving drafts with autosave', async ({
        payload,
      }) => {
        const created = await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: {
            title: 'title',
          },
          draft: true,
          overrideAccess: true,
        })

        await wait(10)

        const updated = await payload.updateGlobal({
          slug: draftGlobalSlug,
          autosave: true,
          data: {
            title: 'updated title',
          },
          draft: true,
          overrideAccess: true,
        })

        const createdUpdatedAt = new Date(created.updatedAt)
        const updatedUpdatedAt = new Date(updated.updatedAt)

        expect(Number(updatedUpdatedAt)).toBeGreaterThan(Number(createdUpdatedAt))
      })
    })

    test.describe('Restore', () => {
      test('should allow a version to be restored', async ({ payload }) => {
        const title2 = 'Another updated title in EN'

        const updatedGlobal = await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            title: title2,
          },
          overrideAccess: true,
          publishAllLocales: true,
        })

        expect(updatedGlobal.title).toBe(title2)

        // Make sure it was updated correctly
        const foundUpdatedGlobal = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
          draft: true,
          overrideAccess: true,
        })
        expect(foundUpdatedGlobal.title).toBe(title2)

        const versions = await payload.findGlobalVersions({
          slug: autoSaveGlobalSlug,
          overrideAccess: true,
        })

        const restore = await payload.restoreGlobalVersion({
          id: versions.docs[1]!.id,
          slug: autoSaveGlobalSlug,
          overrideAccess: true,
        })

        expect(restore.version.title).toBeDefined()

        const restoredGlobal = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
          draft: true,
          overrideAccess: true,
        })

        expect(restoredGlobal.title).toBe(restore.version.title.en)
      })
    })

    test.describe('Global update access control', () => {
      const seedGlobalForUpdateAccess = async (payload: Payload) => {
        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { title: 'historical' },
          overrideAccess: true,
        })

        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { title: 'current' },
          overrideAccess: true,
        })
      }

      test.afterEach(async ({ payload }) => {
        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { title: 'reset' },
          overrideAccess: true,
        })

        await payload.db.deleteVersions({
          globalSlug: restoreAccessGlobalSlug,
          where: {},
        })

        await payload.updateGlobal({
          slug: restoreAccessNoVersionsGlobalSlug,
          data: { title: 'reset' },
          overrideAccess: true,
        })
      })

      test('should allow updates when the current global matches the access constraint', async ({
        payload,
      }) => {
        await seedGlobalForUpdateAccess(payload)

        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { title: 'unlocked' },
          overrideAccess: true,
        })

        const updated = await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { title: 'updated' },
          overrideAccess: false,
          user,
        })

        expect(updated.title).toBe('updated')
      })

      test('should reject updates when the current global does not match the access constraint', async ({
        payload,
      }) => {
        await seedGlobalForUpdateAccess(payload)

        await expect(
          payload.updateGlobal({
            slug: restoreAccessGlobalSlug,
            data: { title: 'updated' },
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow(Forbidden)

        const current = await payload.findGlobal({
          slug: restoreAccessGlobalSlug,
          overrideAccess: true,
        })
        expect(current.title).toBe('current')
      })

      test('should reject non-versioned global updates outside the access constraint', async ({
        payload,
      }) => {
        await payload.updateGlobal({
          slug: restoreAccessNoVersionsGlobalSlug,
          data: { title: 'current' },
          overrideAccess: true,
        })

        await expect(
          payload.updateGlobal({
            slug: restoreAccessNoVersionsGlobalSlug,
            data: { title: 'updated' },
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow(Forbidden)

        const current = await payload.findGlobal({
          slug: restoreAccessNoVersionsGlobalSlug,
          overrideAccess: true,
        })
        expect(current.title).toBe('current')
      })

      test('should use one global lookup when access is not constrained', async ({ payload }) => {
        const findGlobal = vi.spyOn(payload.db, 'findGlobal')

        try {
          await payload.updateGlobal({
            slug: restoreAccessNoVersionsGlobalSlug,
            data: { title: 'updated' },
            overrideAccess: true,
          })

          expect(findGlobal).toHaveBeenCalledTimes(1)
        } finally {
          findGlobal.mockRestore()
        }
      })
    })

    test.describe('Restore - access control', () => {
      const seedRestoreAccessGlobal = async (payload: Payload): Promise<number | string> => {
        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { title: 'historical' },
          overrideAccess: true,
        })

        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { title: 'current' },
          overrideAccess: true,
        })

        const versions = await payload.findGlobalVersions({
          slug: restoreAccessGlobalSlug,
          limit: 100,
          overrideAccess: true,
        })

        const target = versions.docs.find((doc) => doc.version.title === 'historical')

        return target!.id
      }

      test.afterEach(async ({ payload }) => {
        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { title: 'reset' },
          overrideAccess: true,
        })

        await payload.db.deleteVersions({
          globalSlug: restoreAccessGlobalSlug,
          where: {},
        })
      })

      test('should restore when update access returns true', async ({ payload }) => {
        const versionID = await seedRestoreAccessGlobal(payload)

        const restored = await payload.restoreGlobalVersion({
          id: versionID,
          slug: restoreAccessGlobalSlug,
          context: { restoreAccessMode: 'allow' },
          overrideAccess: false,
          user,
        })

        expect(restored.version.title).toBe('historical')
      })

      test('should throw Forbidden when update access returns false', async ({ payload }) => {
        const versionID = await seedRestoreAccessGlobal(payload)

        await expect(
          payload.restoreGlobalVersion({
            id: versionID,
            slug: restoreAccessGlobalSlug,
            context: { restoreAccessMode: 'deny' },
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow(Forbidden)

        const current = await payload.findGlobal({
          slug: restoreAccessGlobalSlug,
          overrideAccess: true,
        })
        expect(current.title).toBe('current')
      })

      test('should restore when the current global matches the update Where constraint', async ({
        payload,
      }) => {
        const versionID = await seedRestoreAccessGlobal(payload)

        // Move the current global into the 'unlocked' state so it satisfies the
        // constrained update rule (title equals 'unlocked').
        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { title: 'unlocked' },
          overrideAccess: true,
        })

        const restored = await payload.restoreGlobalVersion({
          id: versionID,
          slug: restoreAccessGlobalSlug,
          overrideAccess: false,
          user,
        })

        expect(restored.version.title).toBe('historical')
      })

      test('should throw Forbidden when the current global does not match the update Where constraint', async ({
        payload,
      }) => {
        // Current title is 'current', constraint requires title === 'unlocked',
        // so the current global does not match and restore must be denied.
        const versionID = await seedRestoreAccessGlobal(payload)

        await expect(
          payload.restoreGlobalVersion({
            id: versionID,
            slug: restoreAccessGlobalSlug,
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow(Forbidden)

        const current = await payload.findGlobal({
          slug: restoreAccessGlobalSlug,
          overrideAccess: true,
        })
        expect(current.title).toBe('current')
      })

      test('should throw Forbidden when read-version access filters out the selected version', async ({
        payload,
      }) => {
        const versionID = await seedRestoreAccessGlobal(payload)

        await expect(
          payload.restoreGlobalVersion({
            id: versionID,
            slug: restoreAccessGlobalSlug,
            // Allow the update so the read-version check is isolated.
            context: { readVersionsMode: 'constrained', restoreAccessMode: 'allow' },
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow(Forbidden)

        const current = await payload.findGlobal({
          slug: restoreAccessGlobalSlug,
          overrideAccess: true,
        })
        expect(current.title).toBe('current')
      })
    })

    test.describe('Restore - publication access control', () => {
      const createdCollectionDocIDs: Array<number | string> = []
      const createdLocalizedDocIDs: Array<number | string> = []

      test.afterEach(async ({ payload }) => {
        for (const id of createdCollectionDocIDs) {
          await payload.delete({
            id,
            collection: restoreAccessCollectionSlug,
            overrideAccess: true,
          })
        }
        createdCollectionDocIDs.length = 0

        for (const id of createdLocalizedDocIDs) {
          await payload.delete({
            id,
            collection: restoreAccessLocalizedCollectionSlug,
            overrideAccess: true,
          })
        }
        createdLocalizedDocIDs.length = 0

        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { title: 'reset' },
          overrideAccess: true,
        })
        await payload.db.deleteVersions({
          globalSlug: restoreAccessGlobalSlug,
          where: {},
        })
      })

      const findCollectionVersionByStatus = async (
        payload: Payload,
        docID: number | string,
        status: string,
      ): Promise<number | string> => {
        const versions = await payload.findVersions({
          collection: restoreAccessCollectionSlug,
          limit: 100,
          overrideAccess: true,
          where: { parent: { equals: docID } },
        })
        const target = versions.docs.find((doc) => doc.version._status === status)

        return target!.id
      }

      test('should deny restoring a published version when update access denies publishing', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: restoreAccessCollectionSlug,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
        })
        createdCollectionDocIDs.push(doc.id)

        // Unpublish so the live document is a draft and a historical published version exists.
        await payload.update({
          id: doc.id,
          collection: restoreAccessCollectionSlug,
          data: { _status: 'draft', title: 'unpublished' },
          overrideAccess: true,
        })

        const publishedVersionID = await findCollectionVersionByStatus(payload, doc.id, 'published')

        // Restoring the published version would re-publish; the publish gate must deny it now
        // that access.update sees the effective _status the restore will write.
        await expect(
          payload.restoreVersion({
            id: publishedVersionID,
            collection: restoreAccessCollectionSlug,
            context: { restoreAccessMode: 'publishGate' },
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow(Forbidden)

        const current = await payload.findByID({
          id: doc.id,
          collection: restoreAccessCollectionSlug,
          draft: true,
          overrideAccess: true,
        })
        expect(current._status).toBe('draft')
      })

      test('should allow restoring a draft version under the publish gate', async ({ payload }) => {
        const doc = await payload.create({
          collection: restoreAccessCollectionSlug,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
        })
        createdCollectionDocIDs.push(doc.id)

        await payload.update({
          id: doc.id,
          collection: restoreAccessCollectionSlug,
          data: { _status: 'draft', title: 'draft version' },
          draft: true,
          overrideAccess: true,
        })

        const draftVersionID = await findCollectionVersionByStatus(payload, doc.id, 'draft')

        // The restore writes _status='draft', which the publish gate permits - confirming the fix
        // passes the real _status rather than blanket-denying restores.
        const restored = await payload.restoreVersion({
          id: draftVersionID,
          collection: restoreAccessCollectionSlug,
          context: { restoreAccessMode: 'publishGate' },
          overrideAccess: false,
          user,
        })

        expect(restored._status).toBe('draft')
      })

      test('should deny restoring a draft version when update access denies unpublishing', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: restoreAccessCollectionSlug,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
        })
        createdCollectionDocIDs.push(doc.id)

        // Create a draft version while the live document stays published.
        await payload.update({
          id: doc.id,
          collection: restoreAccessCollectionSlug,
          data: { _status: 'draft', title: 'draft version' },
          draft: true,
          overrideAccess: true,
        })

        const draftVersionID = await findCollectionVersionByStatus(payload, doc.id, 'draft')

        // Restoring the draft version would unpublish the live document; the unpublish gate must
        // deny it.
        await expect(
          payload.restoreVersion({
            id: draftVersionID,
            collection: restoreAccessCollectionSlug,
            context: { restoreAccessMode: 'unpublishGate' },
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow(Forbidden)
      })

      test('should deny restoring a published global version when update access denies publishing', async ({
        payload,
      }) => {
        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { _status: 'published', title: 'published' },
          overrideAccess: true,
        })

        // Unpublish so the live global is a draft and a historical published version exists.
        await payload.updateGlobal({
          slug: restoreAccessGlobalSlug,
          data: { _status: 'draft', title: 'unpublished' },
          overrideAccess: true,
        })

        const versions = await payload.findGlobalVersions({
          slug: restoreAccessGlobalSlug,
          limit: 100,
          overrideAccess: true,
        })
        const publishedVersionID = versions.docs.find(
          (doc) => doc.version._status === 'published',
        )!.id

        await expect(
          payload.restoreGlobalVersion({
            id: publishedVersionID,
            slug: restoreAccessGlobalSlug,
            context: { restoreAccessMode: 'publishGate' },
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow(Forbidden)

        const current = await payload.findGlobal({
          slug: restoreAccessGlobalSlug,
          draft: true,
          overrideAccess: true,
        })
        expect(current._status).toBe('draft')
      })

      test('should deny restoring a mixed-locale version that unpublishes a locale under the unpublish gate', async ({
        payload,
      }) => {
        // A localized field auto-enables localizeStatus, so `_status` is stored per locale.
        // Publish both locales so the live document is fully online.
        const doc = await payload.create({
          collection: restoreAccessLocalizedCollectionSlug,
          data: { _status: 'published', title: 'en published' },
          locale: 'en',
          overrideAccess: true,
        })
        createdLocalizedDocIDs.push(doc.id)

        await payload.update({
          id: doc.id,
          collection: restoreAccessLocalizedCollectionSlug,
          data: { _status: 'published', title: 'de published' },
          locale: 'de',
          overrideAccess: true,
        })

        // Save a draft for `en` only. This leaves the live document fully published and creates a
        // version whose stored `_status` is the mixed object { en: 'draft', de: 'published' }.
        await payload.update({
          id: doc.id,
          collection: restoreAccessLocalizedCollectionSlug,
          data: { _status: 'draft', title: 'en draft' },
          draft: true,
          locale: 'en',
          overrideAccess: true,
        })

        const versions = await payload.findVersions({
          collection: restoreAccessLocalizedCollectionSlug,
          limit: 100,
          locale: 'all',
          overrideAccess: true,
          sort: '-updatedAt',
          where: { parent: { equals: doc.id } },
        })

        const mixedVersion = versions.docs.find((v) => {
          const status = v.version._status as null | Record<string, unknown>
          return status && typeof status === 'object' && status.en === 'draft'
        })

        expect(mixedVersion).toBeDefined()
        expect((mixedVersion!.version._status as Record<string, unknown>).en).toBe('draft')
        expect((mixedVersion!.version._status as Record<string, unknown>).de).toBe('published')

        // Restoring this version writes _status = { en: 'draft', de: 'published' } to the live
        // document, taking `en` offline. The restore evaluates access.update for every status it
        // writes, so the 'draft' transition hits the unpublish gate and the restore is denied.
        await expect(
          payload.restoreVersion({
            id: mixedVersion!.id,
            collection: restoreAccessLocalizedCollectionSlug,
            context: { restoreAccessMode: 'unpublishGate' },
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow(Forbidden)
      })
    })

    test.describe('Patch', () => {
      test('should allow a draft to be patched', async ({ payload }) => {
        const originalTitle = 'Here is a published global'

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            _status: 'published',
            description: 'kjnjyhbbdsfseankuhsjsfghb',
            title: originalTitle,
          },
          overrideAccess: true,
          publishAllLocales: true,
        })

        const publishedGlobal = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
          draft: true,
          overrideAccess: true,
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
          overrideAccess: true,
        })

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            _status: 'draft',
            title: updatedTitle2,
          },
          draft: true,
          locale: 'es',
          overrideAccess: true,
        })

        const updatedGlobal = await payload.findGlobal({
          slug: autoSaveGlobalSlug,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })

        expect(publishedGlobal.title).toBe(originalTitle)
        expect(updatedGlobal.title.en).toBe(updatedTitle2)
        expect(updatedGlobal.title.es).toBe(updatedTitle2)
      })

      test('should allow a draft to be published', async ({ payload }) => {
        const originalTitle = 'Here is a draft'

        await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            _status: 'draft',
            title: originalTitle,
          },
          draft: true,
          overrideAccess: true,
        })

        const updatedTitle2 = 'Now try to publish'

        const result = await payload.updateGlobal({
          slug: autoSaveGlobalSlug,
          data: {
            _status: 'published',
            title: updatedTitle2,
          },
          overrideAccess: true,
        })

        expect(result.title).toBe(updatedTitle2)
      })
    })
  })

  test.describe('Globals - GraphQL', () => {
    let autosaveGlobalVersionID: number | string

    async function createAndSetVersionID({ restClient }: { restClient: NextRESTClient }) {
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

    test.beforeEach(async ({ restClient }) => {
      await createAndSetVersionID({ restClient })
    })
    test.describe('Read', () => {
      test('should allow read of versions by version id', async ({ payload, restClient }) => {
        // language=graphql
        const query = `query {
          versionAutosaveGlobal(id: ${formatGraphQLID({ payload }, autosaveGlobalVersionID)}) {
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

      test('should allow read of versions by querying version content', async ({ restClient }) => {
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

    test.describe('Restore', () => {
      test('should allow a version to be restored', async ({ payload, restClient }) => {
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
          restoreVersionAutosaveGlobal(id: ${formatGraphQLID({ payload }, autosaveGlobalVersionID)}) {
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

  test.describe('Scheduled Publish', () => {
    test('should allow collection scheduled publish', async ({ payload }) => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          title: 'my doc to publish in the future',
        },
        draft: true,
        overrideAccess: true,
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
        overrideAccess: true,
      })

      await wait(4000)

      await payload.jobs.run({ overrideAccess: true })

      const retrieved = await payload.findByID({
        id: draft.id,
        collection: draftCollectionSlug,
        draft: false,
        overrideAccess: true,
      })

      expect(retrieved._status).toStrictEqual('published')

      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug, 'payload-jobs'],
        payload,
      })
    })

    test('should restrict scheduled publish based on user', async ({ payload }) => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          restrictedToUpdate: true,
          title: 'my doc to publish in the future',
        },
        draft: true,
        overrideAccess: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        input: {
          doc: {
            relationTo: draftCollectionSlug,
            value: draft.id,
          },
          user: {
            relationTo: 'users',
            value: user.id,
          },
        },
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
        overrideAccess: true,
      })

      await wait(4000)

      const res = await payload.jobs.run({ overrideAccess: true })

      expect(res.jobStatus[Object.keys(res.jobStatus)[0]].status).toBe('error-reached-max-retries')

      const retrieved = await payload.findByID({
        id: draft.id,
        collection: draftCollectionSlug,
        overrideAccess: true,
      })

      expect(retrieved._status).toStrictEqual('draft')

      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug, 'payload-jobs'],
        payload,
      })
    })

    test('should preserve the scheduling user collection for scheduled publish jobs', async ({
      payload,
    }) => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          title: 'my doc to publish from a secondary admin-capable auth collection',
        },
        draft: true,
        overrideAccess: true,
      })

      const req = await createLocalReq({ user: secondaryAdminUser }, payload)
      const currentDate = new Date()

      await schedulePublishHandler({
        type: 'publish',
        date: new Date(currentDate.getTime() + 3000),
        doc: {
          relationTo: draftCollectionSlug,
          value: draft.id,
        },
        req,
        user: secondaryAdminUser,
      })

      const queuedJob = (
        await payload.find({
          collection: 'payload-jobs',
          overrideAccess: true,
          where: {
            'input.doc.value': {
              equals: draft.id,
            },
          },
        })
      ).docs[0]

      expect(queuedJob?.input?.user).toMatchObject({
        relationTo: secondaryAdminUserCollectionSlug,
        value: secondaryAdminUser.id,
      })

      await wait(4000)

      const runResponse = await payload.jobs.run({ overrideAccess: true })

      expect(runResponse.jobStatus?.[queuedJob.id]?.status).toBe('success')

      const published = await payload.findByID({
        id: draft.id,
        collection: draftCollectionSlug,
        draft: false,
        overrideAccess: true,
      })

      expect(published._status).toBe('published')
    })

    test('should run scheduled publish as the scheduling user, not the admin collection', async ({
      payload,
    }) => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          restrictedToSecondaryCollection: true,
          title: 'my doc restricted from the secondary auth collection',
        },
        draft: true,
        overrideAccess: true,
      })

      const req = await createLocalReq({ user: secondaryAdminUser }, payload)
      const currentDate = new Date()

      await schedulePublishHandler({
        type: 'publish',
        date: new Date(currentDate.getTime() + 3000),
        doc: {
          relationTo: draftCollectionSlug,
          value: draft.id,
        },
        req,
        user: secondaryAdminUser,
      })

      const queuedJob = (
        await payload.find({
          collection: 'payload-jobs',
          overrideAccess: true,
          where: {
            'input.doc.value': {
              equals: draft.id,
            },
          },
        })
      ).docs[0]

      await wait(4000)

      const runResponse = await payload.jobs.run({ overrideAccess: true })

      expect(runResponse.jobStatus?.[queuedJob.id]?.status).toBe('error-reached-max-retries')

      const retrieved = await payload.findByID({
        id: draft.id,
        collection: draftCollectionSlug,
        overrideAccess: true,
      })

      expect(retrieved._status).toBe('draft')
    })

    test('should fail scheduled publish jobs that omit the user auth collection', async ({
      payload,
    }) => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          title: 'my doc scheduled with a legacy bare user id',
        },
        draft: true,
        overrideAccess: true,
      })

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
        overrideAccess: true,
      })

      const queuedJob = (
        await payload.find({
          collection: 'payload-jobs',
          overrideAccess: true,
          where: {
            'input.doc.value': {
              equals: draft.id,
            },
          },
        })
      ).docs[0]

      await wait(4000)

      const runResponse = await payload.jobs.run({ overrideAccess: true })

      expect(runResponse.jobStatus?.[queuedJob.id]?.status).toBe('error-reached-max-retries')

      const retrieved = await payload.findByID({
        id: draft.id,
        collection: draftCollectionSlug,
        draft: false,
        overrideAccess: true,
      })

      expect(retrieved._status).toBe('draft')
    })

    test('should not skip a user id of 0 when running scheduled publish jobs', async ({
      payload,
    }) => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          title: 'my doc scheduled with a zero user id',
        },
        draft: true,
        overrideAccess: true,
      })

      const currentDate = new Date()

      await payload.jobs.queue({
        input: {
          doc: {
            relationTo: draftCollectionSlug,
            value: draft.id,
          },
          user: {
            relationTo: 'users',
            value: 0,
          },
        },
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
        overrideAccess: true,
      })

      const queuedJob = (
        await payload.find({
          collection: 'payload-jobs',
          overrideAccess: true,
          where: {
            'input.doc.value': {
              equals: draft.id,
            },
          },
        })
      ).docs[0]

      await wait(4000)

      const runResponse = await payload.jobs.run({ overrideAccess: true })

      // A `0` id must reach findByID (which fails here) rather than being dropped to an
      // overrideAccess publish, so the doc stays a draft.
      expect(runResponse.jobStatus?.[queuedJob.id]?.status).toBe('error-reached-max-retries')

      const retrieved = await payload.findByID({
        id: draft.id,
        collection: draftCollectionSlug,
        draft: false,
        overrideAccess: true,
      })

      expect(retrieved._status).toBe('draft')
    })

    test('should allow collection scheduled unpublish', async ({ payload }) => {
      const published = await payload.create({
        collection: draftCollectionSlug,
        data: {
          _status: 'published',
          description: 'hello',
          title: 'my doc to publish in the future',
        },
        overrideAccess: true,
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
        overrideAccess: true,
      })

      await wait(4000)

      await payload.jobs.run({ overrideAccess: true })

      const retrieved = await payload.findByID({
        id: published.id,
        collection: draftCollectionSlug,
        overrideAccess: true,
      })

      expect(retrieved._status).toStrictEqual('draft')

      await cleanupDocuments({
        collectionSlugs: [draftCollectionSlug, 'payload-jobs'],
        payload,
      })
    })

    test('should delete scheduled jobs after a document is deleted', async ({ payload }) => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          title: 'my doc to publish in the future',
        },
        draft: true,
        overrideAccess: true,
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
        overrideAccess: true,
      })

      await payload.delete({
        collection: draftCollectionSlug,
        overrideAccess: true,
        where: {
          id: { equals: draft.id },
        },
      })

      const { docs } = await payload.find({
        collection: 'payload-jobs',
        overrideAccess: true,
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

    test('should delete scheduled jobs after a document is deleted by ID', async ({ payload }) => {
      const draft = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'hello',
          title: 'my doc to publish in the future',
        },
        draft: true,
        overrideAccess: true,
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
        overrideAccess: true,
      })

      await payload.delete({
        id: draft.id,
        collection: draftCollectionSlug,
        overrideAccess: true,
      })

      const { docs } = await payload.find({
        collection: 'payload-jobs',
        overrideAccess: true,
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

    test('should allow global scheduled publish', async ({ payload }) => {
      const draft = await payload.updateGlobal({
        slug: draftGlobalSlug,
        data: {
          _status: 'draft',
          title: 'i will publish',
        },
        draft: true,
        overrideAccess: true,
      })

      expect(draft._status).toStrictEqual('draft')

      const currentDate = new Date()

      await payload.jobs.queue({
        input: {
          global: draftGlobalSlug,
        },
        task: 'schedulePublish',
        waitUntil: new Date(currentDate.getTime() + 3000),
        overrideAccess: true,
      })

      await wait(4000)

      await payload.jobs.run({ overrideAccess: true })

      const retrieved = await payload.findGlobal({
        slug: draftGlobalSlug,
        overrideAccess: true,
      })

      expect(retrieved._status).toStrictEqual('published')
      expect(retrieved.title).toStrictEqual('i will publish')
    })

    test('should allow global scheduled unpublish', async ({ payload }) => {
      const draft = await payload.updateGlobal({
        slug: draftGlobalSlug,
        data: {
          _status: 'published',
          title: 'i will be a draft',
        },
        overrideAccess: true,
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
        overrideAccess: true,
      })

      await wait(4000)

      await payload.jobs.run({ overrideAccess: true })

      const retrieved = await payload.findGlobal({
        slug: draftGlobalSlug,
        overrideAccess: true,
      })

      expect(retrieved._status).toStrictEqual('draft')
      expect(retrieved.title).toStrictEqual('i will be a draft')
    })

    test('should not return _status field when access control denies read', async ({ payload }) => {
      // Create a draft global
      const draft = await payload.updateGlobal({
        slug: draftGlobalSlug,
        data: {
          _status: 'draft',
          title: 'draft only',
        },
        draft: true,
        overrideAccess: true,
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

    test.describe('server functions', () => {
      let draftDoc
      let event

      test.beforeEach(async ({ payload }) => {
        draftDoc = await payload.create({
          collection: draftCollectionSlug,
          data: {
            _status: 'draft',
            description: 'hello',
            title: 'my doc',
          },
          overrideAccess: true,
        })
      })

      test.afterEach(async ({ payload }) => {
        await cleanupDocuments({
          collectionSlugs: ['payload-jobs', draftCollectionSlug],
          payload,
        })
      })

      test('should create using schedule-publish', async ({ payload }) => {
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
            overrideAccess: true,
            where: {
              'input.doc.value': {
                equals: draftDoc.id,
              },
            },
          })
        ).docs
        expect(event).toBeDefined()
      })

      test('should get upcoming scheduled publish events without reading the jobs collection', async ({
        payload,
      }) => {
        const req = await createLocalReq({ user }, payload)

        await schedulePublishHandler({
          type: 'publish',
          date: new Date(Date.now() + 60_000),
          doc: {
            relationTo: draftCollectionSlug,
            value: String(draftDoc.id),
          },
          locale: 'all',
          req,
          user,
        })

        const events = await getUpcomingScheduledPublishHandler({
          id: draftDoc.id,
          collectionSlug: draftCollectionSlug,
          req,
        })

        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
          input: {
            type: 'publish',
          },
        })
        expect(events[0]).not.toHaveProperty('taskSlug')
        expect(events[0]?.input).not.toHaveProperty('user')
      })

      test('should not get scheduled publish events without publish permission', async ({
        payload,
      }) => {
        const req = await createLocalReq({ user }, payload)

        await payload.update({
          id: draftDoc.id,
          collection: draftCollectionSlug,
          data: {
            restrictedToUpdate: true,
          },
          overrideAccess: true,
        })

        await expect(
          getUpcomingScheduledPublishHandler({
            id: draftDoc.id,
            collectionSlug: draftCollectionSlug,
            req,
          }),
        ).rejects.toMatchObject({ status: 403 })
      })

      test('should delete using schedule-publish', async ({ payload }) => {
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
            overrideAccess: true,
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
            overrideAccess: true,
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

      test('should not delete a job that is not a scheduled publish', async ({ payload }) => {
        const req = await createLocalReq({ user }, payload)
        const unrelatedJob = await payload.db.create({
          collection: 'payload-jobs',
          data: {
            input: {},
            taskSlug: 'inline',
          },
        })

        await schedulePublishHandler({
          deleteID: unrelatedJob.id,
          req,
          user,
        })

        const result = await payload.findByID({
          id: unrelatedJob.id,
          collection: 'payload-jobs',
          overrideAccess: true,
        })

        expect(result.id).toBe(unrelatedJob.id)
      })
    })
  })

  test.describe('Publish Individual Locale', () => {
    const collection = localizedCollectionSlug
    const global = localizedGlobalSlug

    test.describe('Collections', () => {
      test.beforeEach(async ({ payload }) => {
        await cleanupDocuments({
          collectionSlugs: [collection],
          payload,
        })
      })

      test('should save correct doc data when publishing individual locale', async ({
        payload,
      }) => {
        // save spanish draft
        const draft1 = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
          overrideAccess: true,
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
          overrideAccess: true,
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
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const docWithoutSpanishDraft = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          locale: 'all',
          overrideAccess: true,
        })

        // We're getting the published version,
        // which should not leak any unpublished Spanish content
        // and should retain the English fields that were not explicitly
        // passed in from publishedEN1
        // null (SQL: locale row exists but text is NULL) or undefined (MongoDB) both mean no data
        expect(docWithoutSpanishDraft.text.es ?? null).toBeNull()
        expect(docWithoutSpanishDraft.description.en).toStrictEqual('My English description')

        const docWithSpanishDraft1 = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          draft: true,
          locale: 'all',
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const docWithoutSpanishDraft2 = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          locale: 'all',
          overrideAccess: true,
        })

        // On the second consecutive publish of a specific locale,
        // Make sure we maintain draft data that has never been published
        // even after two + consecutive publish events
        // null (SQL) or undefined (MongoDB) both indicate no published data for this locale
        expect(docWithoutSpanishDraft2.text.es ?? null).toBeNull()
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
          overrideAccess: true,
        })

        const docWithGermanDraft = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          draft: true,
          locale: 'all',
          overrideAccess: true,
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
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const finalPublishedNoES = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          locale: 'all',
          overrideAccess: true,
        })

        expect(finalPublishedNoES.text.de).toStrictEqual('German published 1')
        expect(finalPublishedNoES.text.en).toStrictEqual('English published 3')
        // null (SQL) or undefined (MongoDB) both indicate no published data for this locale
        expect(finalPublishedNoES.text.es ?? null).toBeNull()

        const finalDraft = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          draft: true,
          locale: 'all',
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const finalPublished = await payload.findByID({
          id: draft1.id,
          collection: localizedCollectionSlug,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })

        expect(finalPublished.text.de).toStrictEqual('German published 1')
        expect(finalPublished.text.en).toStrictEqual('English published 3')
        expect(finalPublished.text.es).toStrictEqual('Spanish draft')
      })

      test('should not leak draft data', async ({ payload }) => {
        const draft = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
          overrideAccess: true,
        })

        await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'English publish',
          },
          draft: false,
          overrideAccess: true,
        })

        const publishedOnlyEN = await payload.findByID({
          id: draft.id,
          collection: localizedCollectionSlug,
          locale: 'all',
          overrideAccess: true,
        })

        expect(publishedOnlyEN.text.es ?? null).toBeNull()
        expect(publishedOnlyEN.text.en).toStrictEqual('English publish')
      })

      test('should merge draft data from other locales when publishing all', async ({
        payload,
      }) => {
        const draft = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
          overrideAccess: true,
        })

        await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'English publish',
          },
          draft: false,
          overrideAccess: true,
        })

        const publishedOnlyEN = await payload.findByID({
          id: draft.id,
          collection: localizedCollectionSlug,
          locale: 'all',
          overrideAccess: true,
        })

        expect(publishedOnlyEN.text.es ?? null).toBeNull()
        expect(publishedOnlyEN.text.en).toStrictEqual('English publish')

        const published2 = await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
          },
          draft: false,
          overrideAccess: true,
          publishAllLocales: true,
        })

        const publishedAll = await payload.findByID({
          id: published2.id,
          collection: localizedCollectionSlug,
          locale: 'all',
          overrideAccess: true,
        })

        expect(publishedAll.text.es).toStrictEqual('Spanish draft')
        expect(publishedAll.text.en).toStrictEqual('English publish')
      })

      test('should publish non-default individual locale', async ({ payload }) => {
        const draft = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
          overrideAccess: true,
        })

        const published = await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'German publish',
          },
          draft: false,
          locale: 'de',
          overrideAccess: true,
        })

        const publishedOnlyDE = await payload.findByID({
          id: published.id,
          collection: localizedCollectionSlug,
          locale: 'all',
          overrideAccess: true,
        })

        expect(publishedOnlyDE.text.es ?? null).toBeNull()
        expect(publishedOnlyDE.text.en ?? null).toBeNull()
        expect(publishedOnlyDE.text.de).toStrictEqual('German publish')
      })

      test('should show correct data in latest version', async ({ payload }) => {
        const draft = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
          overrideAccess: true,
        })

        const published = await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            text: 'English publish',
          },
          draft: false,
          overrideAccess: true,
        })

        const publishedOnlyEN = await payload.findByID({
          id: published.id,
          collection: localizedCollectionSlug,
          locale: 'all',
          overrideAccess: true,
        })

        expect(publishedOnlyEN.text.es ?? null).toBeNull()
        expect(publishedOnlyEN.text.en).toStrictEqual('English publish')

        const allVersions = await payload.findVersions({
          collection: localizedCollectionSlug,
          locale: 'all',
          overrideAccess: true,
        })

        const versions = allVersions.docs.filter((version) => version.parent === published.id)
        const latestVersion = versions[0].version

        expect(latestVersion.text.es).toStrictEqual('Spanish draft')
        expect(latestVersion.text.en).toStrictEqual('English publish')
      })

      test('should preserve block metadata when publishing specific locale with blocks added after initial save', async ({
        payload,
      }) => {
        // Step 1: Create doc without blocks (simulates autosave before blocks are added)
        const draft = await payload.create({
          collection: localizedCollectionSlug,
          data: {
            text: 'English draft',
          },
          draft: true,
          locale: 'en',
          overrideAccess: true,
        })

        // Step 2: Update with blocks
        await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            blocks: [
              {
                array: [],
                blockType: 'block',
              },
            ],
            text: 'English with blocks',
          },
          draft: true,
          locale: 'en',
          overrideAccess: true,
        })

        // Step 3: Publish only English locale
        const published = await payload.update({
          id: draft.id,
          collection: localizedCollectionSlug,
          data: {
            _status: 'published',
            blocks: [
              {
                array: [],
                blockType: 'block',
              },
            ],
            text: 'English published with blocks',
          },
          draft: false,
          locale: 'en',
          overrideAccess: true,
        })

        // Blocks should be preserved with blockType intact
        expect(published.blocks).toHaveLength(1)
        expect(published.blocks[0].blockType).toBe('block')
        expect(published.blocks[0].id).toBeDefined()

        // Verify via findByID as well
        const found = await payload.findByID({
          id: draft.id,
          collection: localizedCollectionSlug,
          overrideAccess: true,
        })

        expect(found.blocks).toHaveLength(1)
        expect(found.blocks[0].blockType).toBe('block')
        expect(found.blocks[0].id).toBeDefined()
      })
    })

    test.describe('Globals', () => {
      test.beforeEach(async ({ payload }) => {
        // Clear global data by resetting to empty values
        await cleanupGlobal({
          globalSlug: global,
          payload,
        })
      })
      test('should save correct global data when publishing individual locale', async ({
        payload,
      }) => {
        // publish german
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'German published',
          },
          locale: 'de',
          overrideAccess: true,
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
          overrideAccess: true,
        })

        // publish only english
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'Eng published',
          },
          locale: 'en',
          overrideAccess: true,
        })

        const globalData = await payload.findGlobal({
          slug: global,
          locale: 'all',
          overrideAccess: true,
        })

        // Expect only previously published data to be present
        expect(globalData.title.es).toBeUndefined()
        expect(globalData.title.en).toStrictEqual('Eng published')
        expect(globalData.title.de).toStrictEqual('German published')
      })

      test('should not leak draft data', async ({ payload }) => {
        // save spanish draft
        await payload.updateGlobal({
          slug: global,
          data: {
            title: 'Another spanish draft',
          },
          draft: true,
          locale: 'es',
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const globalData = await payload.findGlobal({
          slug: global,
          locale: 'all',
          overrideAccess: true,
        })

        // Expect no draft data to be present
        expect(globalData.title.es).toBeUndefined()
        expect(globalData.title.en).toStrictEqual('Eng published')
      })

      test('should merge draft data from other locales when publishing all', async ({
        payload,
      }) => {
        // save spanish draft
        await payload.updateGlobal({
          slug: global,
          data: {
            content: 'Spanish draft content',
            title: 'Spanish draft',
          },
          draft: true,
          locale: 'es',
          overrideAccess: true,
        })

        // publish only english
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'Eng published',
          },
          locale: 'en',
          overrideAccess: true,
        })

        const publishedOnlyEN = await payload.findGlobal({
          slug: global,
          locale: 'all',
          overrideAccess: true,
        })

        expect(publishedOnlyEN.title.es).toBeUndefined()
        expect(publishedOnlyEN.title.en).toStrictEqual('Eng published')

        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
          },
          overrideAccess: true,
          publishAllLocales: true,
        })

        const publishedAll = await payload.findGlobal({
          slug: global,
          locale: 'all',
          overrideAccess: true,
        })

        expect(publishedAll.title.es).toStrictEqual('Spanish draft')
        expect(publishedAll.title.en).toStrictEqual('Eng published')
      })

      test('should publish non-default individual locale', async ({ payload }) => {
        // save spanish draft
        await payload.updateGlobal({
          slug: global,
          data: {
            content: 'Test span draft content',
            title: 'Test span draft',
          },
          draft: true,
          locale: 'es',
          overrideAccess: true,
        })

        // publish only german
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'German published',
          },
          locale: 'de',
          overrideAccess: true,
        })

        const globalData = await payload.findGlobal({
          slug: global,
          locale: 'all',
          overrideAccess: true,
        })

        // Expect only published data to be present
        expect(globalData.title.es).toBeFalsy()
        expect(globalData.title.de).toStrictEqual('German published')
      })

      test('should show correct data in latest version', async ({ payload }) => {
        // save spanish draft
        await payload.updateGlobal({
          slug: global,
          data: {
            content: 'New spanish draft content',
            title: 'New spanish draft',
          },
          draft: true,
          locale: 'es',
          overrideAccess: true,
        })

        // publish only english
        await payload.updateGlobal({
          slug: global,
          data: {
            _status: 'published',
            title: 'New eng',
          },
          draft: false,
          overrideAccess: true,
        })

        const allVersions = await payload.findGlobalVersions({
          slug: global,
          locale: 'all',
          overrideAccess: true,
          where: {
            'version._status.en': {
              equals: 'published',
            },
          },
        })

        const versions = allVersions.docs
        const latestVersion = versions[0].version
        expect(latestVersion.title.es).toStrictEqual('New spanish draft')
        expect(latestVersion.title.en).toStrictEqual('New eng')
      })
    })
  })
})
