import { GraphQLClient, request } from 'graphql-request'

import payload from '../../packages/payload/src'
import { devUser } from '../credentials'
import { initPayloadTest } from '../helpers/configHelpers'
import AutosavePosts from './collections/Autosave'
import configPromise from './config'
import AutosaveGlobal from './globals/Autosave'
import { clearAndSeedEverything } from './seed'
import { autosaveCollectionSlug, draftCollectionSlug, versionCollectionSlug } from './slugs'

let collectionLocalPostID: string
let collectionLocalVersionID

let graphQLURL

let graphQLClient
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

const formatGraphQLID = (id: number | string) =>
  payload.db.defaultIDType === 'number' ? id : `"${id}"`

describe('Versions', () => {
  beforeAll(async () => {
    const config = await configPromise

    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } })
    graphQLURL = `${serverURL}${config.routes.api}${config.routes.graphQL}`

    const login = `
      mutation {
        loginUser(
          email: "${devUser.email}",
          password: "${devUser.password}"
        ) {
          token
        }
      }`

    const response = await request(graphQLURL, login)
    token = response.loginUser.token
    graphQLClient = new GraphQLClient(graphQLURL, { headers: { Authorization: `JWT ${token}` } })
  })

  beforeEach(async () => {
    await clearAndSeedEverything(payload)

    // now: initialize
    const autosavePost = await payload.create({
      collection,
      data: {
        description: '345j23o4ifj34jf54g',
        title: 'Here is an autosave post in EN',
      },
    })
    collectionLocalPostID = autosavePost.id

    const updatedPost: {
      _status?: string
      title: string
    } = await payload.update({
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

      // https://github.com/payloadcms/payload/issues/5157
      it('should save to version table with correct hasMany select field value', async () => {
        // save draft
        const post = await payload.create({
          collection: versionCollectionSlug,
          draft: true,
          data: {
            title: 'title1',
            description: 'this is description',
          },
        })
        // publish
        await payload.update({
          collection: versionCollectionSlug,
          id: post.id,
          data: { title: 'title2', tags: ['tag1'], _status: 'published' },
        })

        const versions = await payload.findVersions({
          collection: versionCollectionSlug,
          draft: true,
          where: { parent: { equals: post.id } },
        })
        expect(
          versions.docs.map(({ version: { title, tags } }) => ({ title, tags })),
        ).toStrictEqual(
          expect.arrayContaining([
            { title: 'title1', tags: [] },
            { title: 'title2', tags: ['tag1'] },
          ]),
        )
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

        // @ts-expect-error
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
        // @ts-expect-error
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
          updatedAt: latestDraft.updatedAt,
        })
        expect(latestDraft.blocksField).toHaveLength(0)
      })
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
            id: {
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

      const response = await graphQLClient.request(query)

      const data = response.createAutosavePost
      collectionGraphQLPostID = data.id
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

        const response = await graphQLClient.request(query)

        const data = response.createAutosavePost

        expect(data._status).toStrictEqual('draft')
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
        await graphQLClient.request(update)

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

        const response = await graphQLClient.request(query)

        collectionGraphQLVersionID = response.versionsAutosavePosts.docs[0].id
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

        const response = await graphQLClient.request(query)

        const data = response.versionAutosavePost

        expect(data.id).toBeDefined()
        expect(data.parent.id).toStrictEqual(collectionGraphQLPostID)
        expect(data.version.title).toStrictEqual(updatedTitle2)
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

        const response = await graphQLClient.request(query)

        const data = response.versionsAutosavePosts
        const doc = data.docs[0]

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
        await graphQLClient.request(update)

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

        const response = await graphQLClient.request(query)

        collectionGraphQLVersionID = response.versionsAutosavePosts.docs[0].id
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
        await graphQLClient.request(update)

        // restore a versionsPost
        const restore = `mutation {
          restoreVersionAutosavePost(id: ${formatGraphQLID(collectionGraphQLVersionID)}) {
            title
          }
        }`

        await graphQLClient.request(restore)

        const query = `query {
          AutosavePost(id: ${formatGraphQLID(collectionGraphQLPostID)}) {
            title
          }
        }`

        const response = await graphQLClient.request(query)
        const data = response.AutosavePost
        expect(data.title).toStrictEqual(collectionGraphQLOriginalTitle)
      })
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

      const updatedGlobal = await payload.updateGlobal({
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

        expect(restore.title).toBeDefined()

        const restoredGlobal = await payload.findGlobal({
          slug: globalSlug,
          draft: true,
        })

        expect(restoredGlobal.title).toBe(restore.title)
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
            title: updatedTitle2,
          },
          draft: true,
          locale: 'en',
        })

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
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
      await graphQLClient.request(update)

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

      const response = await graphQLClient.request(query)

      globalGraphQLVersionID = response.versionsAutosaveGlobal.docs[0].id
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

        const response = await graphQLClient.request(query)

        const data = response.versionAutosaveGlobal

        expect(data.id).toBeDefined()
        expect(data.version.title).toStrictEqual(globalGraphQLOriginalTitle)
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

        const response = await graphQLClient.request(query)

        const data = response.versionsAutosaveGlobal
        const doc = data.docs[0]

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

        await graphQLClient.request(restore)

        const query = `query {
          AutosaveGlobal {
            title
          }
        }`

        const response = await graphQLClient.request(query)
        const data = response.AutosaveGlobal
        expect(data.title).toStrictEqual(globalGraphQLOriginalTitle)
      })
    })
  })
})
