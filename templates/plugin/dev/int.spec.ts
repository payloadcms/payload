import type { Payload } from 'payload'

import config from '@payload-config'
import dotenv from 'dotenv'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { createPayloadRequest, getPayload } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { getCustomEndpointHandler } from '../src/endpoints/getCustomEndpointHandler.js'
const dirname = path.dirname(fileURLToPath(import.meta.url))

let payload: Payload
let memoryDB: MongoMemoryReplSet | undefined

afterAll(async () => {
  if (payload.db.destroy) {
    await payload.db.destroy()
  }

  if (memoryDB) {
    await memoryDB.stop()
  }
})

beforeAll(async () => {
  process.env.DISABLE_PAYLOAD_HMR = 'true'
  process.env.PAYLOAD_DROP_DATABASE = 'true'

  dotenv.config({
    path: path.resolve(dirname, './.env'),
  })

  if (!process.env.DATABASE_URI) {
    console.log('Starting memory database')
    memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })
    console.log('Memory database started')

    process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
  }

  const { default: config } = await import('./payload.config.js')

  payload = await getPayload({ config })
})

describe('Plugin integration tests', () => {
  const customEndpointHandler = getCustomEndpointHandler()

  test('should query custom endpoint added by plugin', async () => {
    const request = new Request('http://localhost:3000/api/my-plugin-endpoint', {
      method: 'GET',
    })

    const payloadRequest = await createPayloadRequest({ config, request })
    const response = await customEndpointHandler(payloadRequest)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toMatchObject({
      message: 'Hello from custom endpoint',
    })
  })

  test('can create post with custom text field added by plugin', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        addedByPlugin: 'added by plugin',
      },
    })
    expect(post.addedByPlugin).toBe('added by plugin')
  })

  test('plugin creates and seeds plugin-collection', async () => {
    expect(payload.collections['plugin-collection']).toBeDefined()

    const { docs } = await payload.find({ collection: 'plugin-collection' })

    expect(docs).toHaveLength(1)
  })
})
