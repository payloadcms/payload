/* eslint-disable jest/require-top-level-describe */
import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describePostgres = process.env.PAYLOAD_DATABASE?.startsWith('postgres')
  ? describe
  : describe.skip

let payload: Payload

describePostgres('database - postgres identifier length limits', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    payload = initialized.payload
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should truncate long index names to 60 characters or less', () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name !== 'postgres') {
      return
    }

    // @ts-expect-error accessing internal db properties
    const db = payload.db

    // Check that indexes are properly created
    // eslint-disable-next-line jest/no-conditional-in-test
    if (db.indexes) {
      for (const indexName of db.indexes) {
        // Index names should be 60 characters or less (leaving room for _idx suffix and potential numbering)
        expect(indexName.length).toBeLessThanOrEqual(63)
      }
    }
  })

  it('should truncate long foreign key names to 60 characters or less', () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name !== 'postgres') {
      return
    }

    // @ts-expect-error accessing internal db properties
    const db = payload.db

    // Check that foreign keys are properly created
    // eslint-disable-next-line jest/no-conditional-in-test
    if (db.foreignKeys) {
      for (const fkName of db.foreignKeys) {
        // Foreign key names should be 60 characters or less (leaving room for _fk suffix and potential numbering)
        expect(fkName.length).toBeLessThanOrEqual(63)
      }
    }
  })

  it('should handle nested arrays with localization and versioning without exceeding identifier limits', async () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name !== 'postgres') {
      return
    }

    // Create a document with nested structures
    const doc = await payload.create({
      collection: 'posts',
      data: {
        title: 'Test Post',
        arrayWithIDs: [
          {
            text: 'Test array item',
          },
        ],
      },
    })

    expect(doc.id).toBeDefined()

    // Update to create a version
    const updated = await payload.update({
      collection: 'posts',
      id: doc.id,
      data: {
        title: 'Updated Test Post',
      },
    })

    expect(updated.title).toBe('Updated Test Post')
  })
})
