import type { Payload } from 'payload'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'
import { arraySlug } from './shared.js'

let payload: Payload

describe('array-update', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(configPromise))
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
            required: 'a required field here',
            optional: originalText,
          },
          {
            required: 'another required field here',
            optional: 'this is cool',
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
      required: updatedText,
      optional: originalText,
    })
  })

  it('should disregard existing array-based data while updating and NOT passing row ID', async () => {
    const updatedText = 'here is some new text'

    const secondArrayItem = {
      required: 'test',
      optional: 'optional test',
    }

    const doc = await payload.create({
      collection: arraySlug,
      data: {
        arrayOfFields: [
          {
            required: 'a required field here',
            optional: 'some optional text',
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
