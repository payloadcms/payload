import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { arraySlug } from './shared.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('array-update', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
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

  it('should assign fresh row IDs to each doc on bulk update when row IDs are reused', async () => {
    const docA = await payload.create({
      collection: arraySlug,
      data: { arrayOfFields: [] },
    })
    const docB = await payload.create({
      collection: arraySlug,
      data: { arrayOfFields: [] },
    })

    const reusedRowID = '6116a7f0f0f0f0f0f0f0f0f0'
    const reusedInnerRowID = '6116a7f0f0f0f0f0f0f0f0f1'

    const { docs, errors } = await payload.update({
      collection: arraySlug,
      data: {
        arrayOfFields: [
          {
            id: reusedRowID,
            innerArrayOfFields: [{ id: reusedInnerRowID, required: 'inner value' }],
            required: 'bulk value',
          },
        ],
      },
      where: { id: { in: [docA.id, docB.id] } },
    })

    expect(errors).toHaveLength(0)
    expect(docs).toHaveLength(2)

    const updatedA = await payload.findByID({ id: docA.id, collection: arraySlug })
    const updatedB = await payload.findByID({ id: docB.id, collection: arraySlug })

    expect(updatedA.arrayOfFields?.[0].required).toBe('bulk value')
    expect(updatedB.arrayOfFields?.[0].required).toBe('bulk value')
    expect(updatedA.arrayOfFields?.[0].innerArrayOfFields?.[0].required).toBe('inner value')
    expect(updatedB.arrayOfFields?.[0].innerArrayOfFields?.[0].required).toBe('inner value')

    expect(updatedA.arrayOfFields?.[0].id).not.toBe(updatedB.arrayOfFields?.[0].id)
    expect(updatedA.arrayOfFields?.[0].innerArrayOfFields?.[0].id).not.toBe(
      updatedB.arrayOfFields?.[0].innerArrayOfFields?.[0].id,
    )
  })

  it('should preserve existing row IDs of the matching doc during bulk update', async () => {
    const docWithExistingRow = await payload.create({
      collection: arraySlug,
      data: { arrayOfFields: [{ required: 'existing row' }] },
    })
    const otherDoc = await payload.create({
      collection: arraySlug,
      data: { arrayOfFields: [] },
    })

    const existingRowID = docWithExistingRow.arrayOfFields![0].id

    const { errors } = await payload.update({
      collection: arraySlug,
      data: {
        arrayOfFields: [
          { id: existingRowID, required: 'updated existing row' },
          { required: 'new row' },
        ],
      },
      where: { id: { in: [docWithExistingRow.id, otherDoc.id] } },
    })

    expect(errors).toHaveLength(0)

    const updatedWithExistingRow = await payload.findByID({
      id: docWithExistingRow.id,
      collection: arraySlug,
    })
    const updatedOther = await payload.findByID({ id: otherDoc.id, collection: arraySlug })

    expect(updatedWithExistingRow.arrayOfFields?.[0].id).toBe(existingRowID)
    expect(updatedWithExistingRow.arrayOfFields?.[0].required).toBe('updated existing row')

    expect(updatedOther.arrayOfFields?.[0].id).not.toBe(existingRowID)
    expect(updatedOther.arrayOfFields?.[0].required).toBe('updated existing row')
  })
})
