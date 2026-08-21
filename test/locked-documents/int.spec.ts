import type { Payload, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import path from 'path'
import { Locked, NotFound } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { Post, User } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { menuSlug } from './globals/Menu/index.js'
import { pagesSlug, postsSlug } from './slugs.js'

const lockedDocumentCollection = 'payload-locked-documents'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Locked documents', () => {
  let post: Post
  let user: any
  let user2: any
  let postConfig: SanitizedCollectionConfig

  beforeAll(async () => {
    // @ts-expect-error: initPayloadInt does not have a proper type definition
    ;({ payload } = await initPayloadInt(dirname))

    postConfig = payload.config.collections.find(
      ({ slug }) => slug === postsSlug,
    ) as SanitizedCollectionConfig

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })

    user = loginResult.user

    user2 = await payload.create({
      collection: 'users',
      data: {
        email: 'test@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    post = await payload.create({
      collection: postsSlug,
      data: {
        text: 'some post',
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: pagesSlug,
      data: {
        text: 'some page',
      },
      overrideAccess: true,
    })

    await payload.updateGlobal({
      slug: menuSlug,
      data: {
        globalText: 'global text',
      },
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(() => {
    postConfig.lockDocuments = { duration: 300 }
  })

  it('should update unlocked document - collection', async () => {
    const updatedPost = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post',
      },
      id: post.id,
      overrideAccess: true,
    })

    expect(updatedPost.text).toEqual('updated post')
  })

  it('should update unlocked document - global', async () => {
    const updatedGlobalMenu = await payload.updateGlobal({
      slug: menuSlug,
      data: {
        globalText: 'updated global text',
      },
      overrideAccess: true,
    })

    expect(updatedGlobalMenu.globalText).toEqual('updated global text')
  })

  it('should delete unlocked document - collection', async () => {
    const { docs } = await payload.find({
      collection: postsSlug,
      depth: 0,
      overrideAccess: true,
    })

    expect(docs).toHaveLength(2)

    await payload.delete({
      collection: postsSlug,
      id: post.id,
      overrideAccess: true,
    })

    const { docs: deletedResults } = await payload.find({
      collection: postsSlug,
      depth: 0,
      overrideAccess: true,
    })

    expect(deletedResults).toHaveLength(1)
  })

  it('should allow update of stale locked document - collection', async () => {
    const newPost2 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 2',
      },
      overrideAccess: true,
    })

    // Set lock duration to 1 second for testing purposes
    postConfig.lockDocuments = { duration: 1 }

    // Give locking ownership to another user
    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost2.id,
        },
        globalSlug: undefined,
      },
      overrideAccess: true,
    })

    await wait(1100)

    const updateLockedDoc = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post 2',
      },
      overrideLock: false,
      id: newPost2.id,
      overrideAccess: true,
    })
    postConfig.lockDocuments = { duration: 300 }

    // Should allow update since editedAt date is past expiration duration.
    // Therefore the document is considered stale
    expect(updateLockedDoc.text).toEqual('updated post 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
        overrideAccess: true,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
      overrideAccess: true,
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow update of stale locked document - global', async () => {
    // Set lock duration to 1 second for testing purposes
    const globalConfig = payload.config.globals.find(
      ({ slug }) => slug === menuSlug,
    ) as SanitizedGlobalConfig
    globalConfig.lockDocuments = { duration: 1 }
    // Give locking ownership to another user
    const lockedGlobalInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: undefined,
        globalSlug: menuSlug,
      },
      overrideAccess: true,
    })

    await wait(1100)

    const updateGlobalLockedDoc = await payload.updateGlobal({
      data: {
        globalText: 'global text 2',
      },
      overrideLock: false,
      slug: menuSlug,
      overrideAccess: true,
    })
    globalConfig.lockDocuments = { duration: 300 }

    // Should allow update since editedAt date is past expiration duration.
    // Therefore the document is considered stale
    expect(updateGlobalLockedDoc.globalText).toEqual('global text 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedGlobalInstance.id,
        overrideAccess: true,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedGlobalInstance.id },
      },
      overrideAccess: true,
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should not allow update of locked document - collection', async () => {
    const newPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'some post',
      },
      overrideAccess: true,
    })

    // Give locking ownership to another user
    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: {
          relationTo: 'posts',
          value: newPost.id,
        },
        globalSlug: undefined,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
      },
      overrideAccess: true,
    })

    try {
      await payload.update({
        collection: postsSlug,
        data: {
          text: 'updated post',
        },
        overrideLock: false, // necessary to trigger the lock check
        id: newPost.id,
        overrideAccess: true,
      })
    } catch (error: any) {
      expect(error).toBeInstanceOf(Locked)
      expect(error.message).toMatch(/currently locked by another user and cannot be updated/)
    }

    const updatedPost = await payload.findByID({
      collection: postsSlug,
      id: newPost.id,
      overrideAccess: true,
    })

    // Should not allow update - expect data not to change
    expect(updatedPost.text).toEqual('some post')
  })

  it('should not allow update of locked document - global', async () => {
    // Give locking ownership to another user
    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: undefined,
        globalSlug: menuSlug,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
      },
      overrideAccess: true,
    })

    try {
      await payload.updateGlobal({
        data: {
          globalText: 'updated global text',
        },
        overrideLock: false, // necessary to trigger the lock check
        slug: menuSlug,
        overrideAccess: true,
      })
    } catch (error: any) {
      expect(error).toBeInstanceOf(Locked)
      expect(error.message).toMatch(/currently locked by another user and cannot be updated/)
    }

    const updatedGlobalMenu = await payload.findGlobal({
      slug: menuSlug,
      overrideAccess: true,
    })

    // Should not allow update - expect data not to change
    expect(updatedGlobalMenu.globalText).toEqual('global text 2')
  })

  // Try to delete locked document (collection)
  it('should not allow delete of locked document - collection', async () => {
    const newPost3 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 3',
      },
      overrideAccess: true,
    })

    // Give locking ownership to another user
    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: {
          relationTo: 'posts',
          value: newPost3.id,
        },
        globalSlug: undefined,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
      },
      overrideAccess: true,
    })

    try {
      await payload.delete({
        collection: postsSlug,
        id: newPost3.id,
        overrideLock: false, // necessary to trigger the lock check
        overrideAccess: true,
      })
    } catch (error: any) {
      expect(error).toBeInstanceOf(Locked)
      expect(error.message).toMatch(/currently locked and cannot be deleted/)
    }

    const findPostDocs = await payload.find({
      collection: postsSlug,
      where: {
        id: { equals: newPost3.id },
      },
      overrideAccess: true,
    })

    expect(findPostDocs.docs).toHaveLength(1)
  })

  it('should allow delete of stale locked document - collection', async () => {
    const newPost4 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 4',
      },
      overrideAccess: true,
    })

    // Set lock duration to 1 second for testing purposes
    postConfig.lockDocuments = { duration: 1 }

    // Give locking ownership to another user
    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost4.id,
        },
        globalSlug: undefined,
      },
      overrideAccess: true,
    })

    await wait(1100)

    await payload.delete({
      collection: postsSlug,
      id: newPost4.id,
      overrideLock: false,
      overrideAccess: true,
    })

    const findPostDocs = await payload.find({
      collection: postsSlug,
      where: {
        id: { equals: newPost4.id },
      },
      overrideAccess: true,
    })

    expect(findPostDocs.docs).toHaveLength(0)

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
        overrideAccess: true,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
      overrideAccess: true,
    })

    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow update of locked document w/ overrideLock flag - collection', async () => {
    const newPost5 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 5',
      },
      overrideAccess: true,
    })

    // Give locking ownership to another user
    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost5.id,
        },
        globalSlug: undefined,
      },
      overrideAccess: true,
    })

    const updateLockedDoc = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post 5',
      },
      id: newPost5.id,
      overrideLock: true,
      overrideAccess: true,
    })

    // Should allow update since using overrideLock flag
    expect(updateLockedDoc.text).toEqual('updated post 5')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
        overrideAccess: true,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
      overrideAccess: true,
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow update of locked document w/ overrideLock flag - global', async () => {
    // Give locking ownership to another user
    const lockedGlobalInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        globalSlug: menuSlug,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: undefined,
      },
      overrideAccess: true,
    })

    const updateGlobalLockedDoc = await payload.updateGlobal({
      data: {
        globalText: 'updated global text 2',
      },
      slug: menuSlug,
      overrideLock: true,
      overrideAccess: true,
    })

    // Should allow update since using overrideLock flag
    expect(updateGlobalLockedDoc.globalText).toEqual('updated global text 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedGlobalInstance.id,
        overrideAccess: true,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedGlobalInstance.id },
      },
      overrideAccess: true,
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow delete of locked document w/ overrideLock flag - collection', async () => {
    const newPost6 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 6',
      },
      overrideAccess: true,
    })

    // Give locking ownership to another user
    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost6.id,
        },
        globalSlug: undefined,
      },
      overrideAccess: true,
    })

    await payload.delete({
      collection: postsSlug,
      id: newPost6.id,
      overrideLock: true,
      overrideAccess: true,
    })

    const findPostDocs = await payload.find({
      collection: postsSlug,
      where: {
        id: { equals: newPost6.id },
      },
      overrideAccess: true,
    })

    expect(findPostDocs.docs).toHaveLength(0)

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
        overrideAccess: true,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
      overrideAccess: true,
    })

    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow take over on locked doc (simulates take over modal from admin ui)', async () => {
    const newPost7 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 7',
      },
      overrideAccess: true,
    })

    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost7.id,
        },
        globalSlug: undefined,
      },
      overrideAccess: true,
    })

    // This is the take over action - changing the user to the current user
    await payload.update({
      collection: 'payload-locked-documents',
      data: {
        user: { relationTo: 'users', value: user?.id },
      },
      id: lockedDocInstance.id,
      overrideAccess: true,
    })

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        'user.value': { equals: user.id },
      },
      overrideAccess: true,
    })

    expect(docsFromLocksCollection.docs).toHaveLength(1)
    expect((docsFromLocksCollection.docs[0]?.user.value as User)?.id).toEqual(user.id)
  })
})
