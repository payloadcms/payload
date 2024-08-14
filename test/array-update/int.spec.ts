import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { arraySlug } from './shared.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('array-update', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should persist existing array-based data while updating and passing row ID', async () => {
    const originalText = 'some optional text'

    const doc = await payload.create({
      collection: arraySlug,
      data: {
        arrayOfFields: [
          {
            optional: originalText,
            required: 'a required field here',
          },
          {
            optional: 'this is cool',
            required: 'another required field here',
          },
        ],
      },
    })

    const arrayWithExistingValues = [...doc.arrayOfFields]

    const updatedText = 'this is some new text for the first item in array'

    arrayWithExistingValues[0] = {
      id: arrayWithExistingValues[0].id,
      required: updatedText,
    }

    const updatedDoc = await payload.update({
      id: doc.id,
      collection: arraySlug,
      data: {
        arrayOfFields: arrayWithExistingValues,
      },
    })

    expect(updatedDoc.arrayOfFields?.[0]).toMatchObject({
      optional: originalText,
      required: updatedText,
    })
  })

  it('should disregard existing array-based data while updating and NOT passing row ID', async () => {
    const updatedText = 'here is some new text'

    const secondArrayItem = {
      optional: 'optional test',
      required: 'test',
    }

    const doc = await payload.create({
      collection: arraySlug,
      data: {
        arrayOfFields: [
          {
            optional: 'some optional text',
            required: 'a required field here',
          },
          secondArrayItem,
        ],
      },
    })

    const updatedDoc = await payload.update({
      id: doc.id,
      collection: arraySlug,
      data: {
        arrayOfFields: [
          {
            required: updatedText,
          },
          {
            id: doc.arrayOfFields?.[1].id,
            required: doc.arrayOfFields?.[1].required,
            // NOTE - not passing optional field. It should persist
            // because we're passing ID
          },
        ],
      },
    })

    expect(updatedDoc.arrayOfFields?.[0].required).toStrictEqual(updatedText)
    expect(updatedDoc.arrayOfFields?.[0].optional).toBeFalsy()

    expect(updatedDoc.arrayOfFields?.[1]).toMatchObject(secondArrayItem)
  })
})
