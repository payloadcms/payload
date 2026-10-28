/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.for"] }] -- Tests use the shared fixture wrapper. */
import type { Payload, TransformFileArgs } from 'payload'

import { readFile, rm } from 'fs/promises'
import path from 'path'
import { TransformerContractError } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { ContractStages } from './contractFixtures.js'

import { test } from '../__helpers/int/vitest.js'
import { contractCalls, contractHookCalls, resetContractCalls } from './contractFixtures.js'
import { contractMediaDir, contractMediaSlug, variantMediaSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const variantMediaDir = path.resolve(dirname, 'media')

const textFile = (text: string) => ({
  name: 'note.md',
  data: Buffer.from(text),
  mimetype: 'text/markdown',
  size: Buffer.byteLength(text),
})

const createNote = ({
  contractStages,
  payload,
  text = 'hello',
}: {
  contractStages?: ContractStages
  payload: Payload
  text?: string
}) =>
  payload.create({
    collection: contractMediaSlug,
    context: contractStages ? { contractStages } : undefined,
    data: { alt: 'note', details: { caption: 'A note' } },
    file: textFile(text),
  })

const setTransforms =
  (value: Record<string, unknown>) =>
  ({ doc }: TransformFileArgs) => {
    doc._transforms = value
  }

test.suite('File transformer contract', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    resetContractCalls()
    await rm(contractMediaDir, { force: true, recursive: true })
  })

  test.describe('transformFile arguments', () => {
    test('should pass the upload as source and originalSource', async ({ payload }) => {
      await createNote({ contractStages: {}, payload })

      expect(contractCalls.transformFile[0]).toMatchObject({
        originalSourceText: 'hello',
        source: { filename: 'note.md', mimeType: 'text/markdown', sizeInBytes: 5 },
        sourceText: 'hello',
      })
    })

    test('should pass the incoming document as doc, and a frozen copy as originalDoc', async ({
      payload,
    }) => {
      await createNote({ contractStages: {}, payload })

      const call = contractCalls.transformFile[0]

      expect(call?.docAtStart).toMatchObject({ alt: 'note', details: { caption: 'A note' } })
      expect(call?.originalDoc).toMatchObject({ alt: 'note', details: { caption: 'A note' } })
      expect(call?.isDocFrozen).toBe(false)
      expect(call?.isOriginalDocFrozen).toBe(true)
    })

    test('should pass the stored document merged with the update as doc', async ({ payload }) => {
      const created = await createNote({ payload })

      await payload.update({
        id: created.id,
        collection: contractMediaSlug,
        context: { contractStages: {} },
        data: { alt: 'changed' },
        file: textFile('replacement'),
      })

      expect(contractCalls.transformFile[0]?.docAtStart).toMatchObject({
        id: created.id,
        alt: 'changed',
        details: { caption: 'A note' },
      })
    })

    test('should pass doc at pipeline start as a frozen originalDoc on an update', async ({
      payload,
    }) => {
      const created = await createNote({ payload })
      resetContractCalls()

      await payload.update({
        id: created.id,
        collection: contractMediaSlug,
        context: { contractStages: {} },
        data: { alt: 'changed' },
        file: textFile('replacement'),
      })

      const call = contractCalls.transformFile[0]

      expect(call?.originalDoc).toEqual(call?.docAtStart)
      expect(call?.originalDoc).toMatchObject({
        id: created.id,
        alt: 'changed',
        details: { caption: 'A note' },
      })
      expect(call?.isOriginalDocFrozen).toBe(true)
    })
  })

  test('should pass doc at pipeline start to canTransform as a frozen originalDoc on an update', async ({
    payload,
  }) => {
    const created = await createNote({ payload })
    resetContractCalls()

    await payload.update({
      id: created.id,
      collection: contractMediaSlug,
      context: { contractStages: {} },
      data: { alt: 'changed' },
      file: textFile('replacement'),
    })

    const call = contractCalls.canTransform.find(
      ({ collectionSlug, operation }) =>
        collectionSlug === contractMediaSlug && operation === 'upload',
    )

    expect(call?.originalDoc).toEqual(call?.doc)
    expect(call?.originalDoc).toMatchObject({ alt: 'changed', details: { caption: 'A note' } })
    expect(Object.isFrozen(call?.originalDoc)).toBe(true)
  })

  test('should pass doc and a frozen originalDoc to canTransform', async ({ payload }) => {
    await createNote({ contractStages: {}, payload })

    const call = contractCalls.canTransform.find(
      ({ collectionSlug, operation }) =>
        collectionSlug === contractMediaSlug && operation === 'upload',
    )

    expect(call?.doc).toMatchObject({ alt: 'note' })
    expect(call?.originalDoc).toMatchObject({ alt: 'note' })
    expect(Object.isFrozen(call?.originalDoc)).toBe(true)
  })

  test('should pass doc and a frozen originalDoc to handleRequest', async ({
    payload,
    restClient,
  }) => {
    const created = await createNote({ payload })

    const response = await restClient.GET(
      `/${contractMediaSlug}/file/${created.filename}?contract=1`,
    )

    expect(response.status).toBe(200)
    expect(contractCalls.handleRequest[0]?.doc).toMatchObject({ id: created.id, alt: 'note' })
    expect(contractCalls.handleRequest[0]?.originalDoc).toMatchObject({ id: created.id })
    expect(Object.isFrozen(contractCalls.handleRequest[0]?.originalDoc)).toBe(true)
  })

  test.describe('changing _transforms', () => {
    test('should save a _transforms change', async ({ payload }) => {
      const created = await createNote({
        contractStages: { first: setTransforms({ contractScore: 1 }) },
        payload,
      })

      const stored = await payload.findByID({ id: created.id, collection: contractMediaSlug })

      expect(created._transforms).toEqual({ contractScore: 1 })
      expect(stored._transforms).toEqual({ contractScore: 1 })
    })

    test('should run beforeValidate and beforeChange hooks on the _transforms change', async ({
      payload,
    }) => {
      await createNote({
        contractStages: { first: setTransforms({ contractScore: 1 }) },
        payload,
      })

      expect(contractHookCalls).toEqual([
        { _transforms: { contractScore: 1 }, hook: 'beforeValidate' },
        { _transforms: { contractScore: 1 }, hook: 'beforeChange' },
      ])
    })

    test('should reject an invalid _transforms change and keep the stored document and file', async ({
      payload,
    }) => {
      const created = await createNote({ payload })

      await expect(
        payload.update({
          id: created.id,
          collection: contractMediaSlug,
          context: { contractStages: { first: setTransforms({ crop: 'not-a-crop' }) } },
          data: {},
          file: textFile('replacement'),
        }),
      ).rejects.toThrow()

      const stored = await payload.findByID({ id: created.id, collection: contractMediaSlug })

      expect(stored.filename).toBe(created.filename)
      expect(stored._transforms).toBeNull()
      expect(await readFile(path.join(contractMediaDir, created.filename!), 'utf8')).toBe('hello')
    })

    // Regression for a bug in #18601, where bulk updates and updates by ID resolved transformer
    // changes differently.
    test('should give a bulk update the same result as an update by ID', async ({ payload }) => {
      const first = await createNote({ payload })
      const second = await createNote({ payload })
      const context = { contractStages: { first: setTransforms({ contractScore: 1 }) } }

      const updatedByID = await payload.update({
        id: first.id,
        collection: contractMediaSlug,
        context,
        data: {},
        file: textFile('replacement'),
        overrideAccess: true,
      })
      const bulkUpdated = await payload.update({
        collection: contractMediaSlug,
        context,
        data: {},
        file: textFile('replacement'),
        overrideAccess: true,
        where: { id: { equals: second.id } },
      })

      expect(bulkUpdated.errors).toEqual([])
      expect(bulkUpdated.docs[0]?._transforms).toEqual(updatedByID._transforms)
      expect(updatedByID._transforms).toEqual({ contractScore: 1 })
    })
  })

  test.describe('changing other fields', () => {
    test.for([
      { name: 'a custom field', change: (doc: Record<string, unknown>) => (doc.alt = 'changed') },
      // Regression for a bug in #18601, where removing a group skipped its required fields.
      {
        name: 'a group with required fields',
        change: (doc: Record<string, unknown>) => delete doc.details,
      },
    ])('should reject a change to $name and save nothing', async ({ change }, { payload }) => {
      await expect(
        createNote({ contractStages: { first: ({ doc }) => void change(doc) }, payload }),
      ).rejects.toThrow(TransformerContractError)

      const { totalDocs } = await payload.count({ collection: contractMediaSlug })

      expect(totalDocs).toBe(0)
    })
  })

  // Characterization: this already worked before `source` and `doc` were added.
  test('should keep the output of a transformer that uses only file', async ({ payload }) => {
    const created = await createNote({
      contractStages: {
        first: async ({ file }) => ({
          file: new File([(await file.text()).toUpperCase()], file.name, { type: file.type }),
          status: 'complete',
        }),
      },
      payload,
    })

    expect(await readFile(path.join(contractMediaDir, created.filename!), 'utf8')).toBe('HELLO')
  })

  test.describe('Sharp bridge tasks', () => {
    test.afterEach(async () => {
      await rm(variantMediaDir, { force: true, recursive: true })
    })

    const createImage = async ({
      contractStages,
      payload,
    }: {
      contractStages: ContractStages
      payload: Payload
    }) => {
      const data = await readFile(path.resolve(dirname, 'image.png'))

      return payload.create({
        collection: variantMediaSlug,
        context: { contractStages },
        data: {},
        file: { name: 'image.png', data, mimetype: 'image/png', size: data.length },
        overrideAccess: true,
      })
    }

    test('should keep the main task doc changes and give size tasks a frozen copy', async ({
      payload,
    }) => {
      const created = await createImage({
        contractStages: {
          first: ({ doc }) => {
            if (!Object.isFrozen(doc)) {
              doc._transforms = { contractScore: 1 }
            }
          },
        },
        payload,
      })

      const firstStageCalls = contractCalls.transformFile.filter(
        ({ slug }) => slug === 'contract-first',
      )

      expect(created._transforms).toEqual({ contractScore: 1 })
      expect(firstStageCalls.map(({ isDocFrozen }) => isDocFrozen)).toEqual([false, true])
      expect(firstStageCalls[1]?.docAtStart._transforms).toEqual({ contractScore: 1 })
    })

    test('should reject a doc change from a size task', async ({ payload }) => {
      await expect(
        createImage({
          contractStages: { first: setTransforms({ contractScore: 1 }) },
          payload,
        }),
      ).rejects.toThrow()

      const { totalDocs } = await payload.count({
        collection: variantMediaSlug,
        overrideAccess: true,
      })

      expect(totalDocs).toBe(0)
    })
  })
})
