import type { Payload } from '../../packages/payload/src'

import { getPayload } from '../../packages/payload/src'
import wait from '../../packages/payload/src/utilities/wait'
import { startMemoryDB } from '../startMemoryDB'
import configPromise from './config'

let payload: Payload

describe('@payloadcms/plugin-search', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
  })

  it('should add a search collection', async () => {
    const search = await payload.find({
      collection: 'search',
      depth: 0,
      limit: 1,
    })

    expect(search).toBeTruthy()
  })

  it('should sync published pages to the search collection', async () => {
    const pageToSync = await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        title: 'Hello, world!',
        excerpt: 'This is a test page',
      },
    })

    // wait for the search document to be created
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    const { docs: results } = await payload.find({
      collection: 'search',
      where: {
        'doc.value': {
          equals: pageToSync.id,
        },
      },
      depth: 0,
    })

    expect(results).toHaveLength(1)
    expect(results[0].doc.value).toBe(pageToSync.id)
    expect(results[0].title).toBe('Hello, world!')
    expect(results[0].excerpt).toBe('This is a test page')
  })

  it('should not sync drafts pages to the search collection', async () => {
    const draftPage = await payload.create({
      collection: 'pages',
      data: {
        _status: 'draft',
        title: 'Hello, world!',
        excerpt: 'This is a test page',
      },
    })

    // wait for the search document to be potentially created
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    const { docs: results } = await payload.find({
      collection: 'search',
      where: {
        'doc.value': {
          equals: draftPage.id,
        },
      },
      depth: 0,
    })

    expect(results).toHaveLength(0)
  })

  it('should sync changes made to an existing search document', async () => {
    const pageToReceiveUpdates = await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        title: 'Hello, world!',
        excerpt: 'This is a test page',
      },
    })

    // wait for the search document to be created
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    const { docs: results } = await payload.find({
      collection: 'search',
      where: {
        'doc.value': {
          equals: pageToReceiveUpdates.id,
        },
      },
      depth: 0,
    })

    expect(results).toHaveLength(1)
    expect(results[0].doc.value).toBe(pageToReceiveUpdates.id)
    expect(results[0].title).toBe('Hello, world!')
    expect(results[0].excerpt).toBe('This is a test page')

    await payload.update({
      collection: 'pages',
      id: pageToReceiveUpdates.id,
      data: {
        title: 'Hello, world! (updated)',
        excerpt: 'This is a test page (updated)',
      },
    })

    // wait for the search document to be potentially updated
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    // Do not add `limit` to this query, this way we can test if multiple documents were created
    const { docs: updatedResults } = await payload.find({
      collection: 'search',
      where: {
        'doc.value': {
          equals: pageToReceiveUpdates.id,
        },
      },
      depth: 0,
    })

    expect(updatedResults).toHaveLength(1)
    expect(updatedResults[0].doc.value).toBe(pageToReceiveUpdates.id)
    expect(updatedResults[0].title).toBe('Hello, world! (updated)')
    expect(updatedResults[0].excerpt).toBe('This is a test page (updated)')
  })

  it('should clear the search document when the original document is deleted', async () => {
    const page = await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        title: 'Hello, world!',
        excerpt: 'This is a test page',
      },
    })

    // wait for the search document to be created
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    const { docs: results } = await payload.find({
      collection: 'search',
      where: {
        'doc.value': {
          equals: page.id,
        },
      },
      depth: 0,
    })

    expect(results).toHaveLength(1)
    expect(results[0].doc.value).toBe(page.id)

    await payload.delete({
      collection: 'pages',
      id: page.id,
    })

    // wait for the search document to be potentially deleted
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    const { docs: deletedResults } = await payload.find({
      collection: 'search',
      where: {
        'doc.value': {
          equals: page.id,
        },
      },
      depth: 0,
    })

    expect(deletedResults).toHaveLength(0)
  })
})
