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
  _transforms,
  contractStages,
  payload,
}: {
  _transforms?: Record<string, unknown>
  contractStages?: ContractStages
  payload: Payload
}) =>
  payload.create({
    collection: contractMediaSlug,
    context: contractStages ? { contractStages } : undefined,
    data: { _transforms, alt: 'note', details: { caption: 'A note' } },
    file: textFile('hello'),
  })

/** Applies `_transforms.contractSuffix` to the original, so a test can see what a rebuild started from. */
const appendSuffixToOriginal = async ({ doc, originalSource }: TransformFileArgs) => {
  const original = new TextDecoder().decode(
    await originalSource.readFileBytes({ numberOfBytes: originalSource.sizeInBytes, startByte: 0 }),
  )
  const suffix = (doc._transforms as { contractSuffix?: string } | null)?.contractSuffix ?? ''

  return {
    file: new File([`${original}${suffix}`], 'note.md', { type: 'text/markdown' }),
    status: 'continue' as const,
  }
}

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

  test.for([
    {
      name: 'a create',
      expected: { alt: 'note', filename: 'note.md', filesize: 5 },
      run: async ({ payload }: { payload: Payload }) => {
        await createNote({ contractStages: {}, payload })
      },
    },
    {
      name: 'an update, with the stored fields merged in and the new file',
      expected: { alt: 'changed', filename: 'note.md', filesize: 11 },
      run: async ({ payload }: { payload: Payload }) => {
        const created = await createNote({ payload })

        resetContractCalls()
        await payload.update({
          id: created.id,
          collection: contractMediaSlug,
          context: { contractStages: {} },
          data: { alt: 'changed' },
          file: textFile('replacement'),
        })
      },
    },
  ])(
    'should give canTransform and transformFile the working doc, and a frozen copy as originalDoc, on $name',
    async ({ expected, run }, { payload }) => {
      await run({ payload })

      const call = contractCalls.transformFile[0]
      const canTransformCall = contractCalls.canTransform.find(
        ({ collectionSlug }) => collectionSlug === contractMediaSlug,
      )

      expect(call?.docAtStart).toMatchObject({
        ...expected,
        details: { caption: 'A note' },
        mimeType: 'text/markdown',
      })
      expect(call?.originalDoc).toEqual(call?.docAtStart)
      expect(Object.isFrozen(call?.originalDoc)).toBe(true)
      expect(canTransformCall?.doc).toBe(call?.originalDoc)
    },
  )

  test.describe('request phases', () => {
    test.for([
      { isStored: false, purposes: ['persisted-default', 'request-override'] },
      { isStored: true, purposes: ['request-override'] },
    ])(
      'should run the $purposes phases in order, each with its own options, when isStored is $isStored, keeping _transforms',
      async ({ isStored, purposes }, { payload, restClient }) => {
        const created = await createNote({ _transforms: { contractSuffix: '!' }, payload })

        if (!isStored) {
          await payload.db.updateOne({
            id: created.id,
            collection: contractMediaSlug,
            data: { _stored: false },
          })
        }

        resetContractCalls()

        await restClient.GET(`/${contractMediaSlug}/file/${created.filename}?contract=1`)
        const stored = await payload.findByID({ id: created.id, collection: contractMediaSlug })

        // The fixture's request options echo the `purpose` that its `canTransform` received.
        expect(contractCalls.handleRequest.map(({ options, slug }) => [slug, options])).toEqual(
          purposes.map((purpose) => ['contract-first', { purpose }]),
        )
        expect(stored._transforms).toEqual({ contractSuffix: '!' })
      },
    )
  })

  test('should save a _transforms change after running beforeValidate and beforeChange hooks on it', async ({
    payload,
  }) => {
    const created = await createNote({
      contractStages: { first: setTransforms({ contractScore: 1 }) },
      payload,
    })

    const stored = await payload.findByID({ id: created.id, collection: contractMediaSlug })

    expect(contractHookCalls).toEqual([
      { _transforms: { contractScore: 1 }, hook: 'beforeValidate' },
      { _transforms: { contractScore: 1 }, hook: 'beforeChange' },
    ])
    expect(stored._transforms).toEqual({ contractScore: 1 })
  })

  test('should save focalX and focalY from a focal point that a stage sets', async ({
    payload,
  }) => {
    const created = await createNote({
      contractStages: { first: setTransforms({ focalPoint: { x: 20.4, y: 80 } }) },
      payload,
    })

    expect(created).toMatchObject({
      _transforms: { focalPoint: { x: 20.4, y: 80 } },
      focalX: 20,
      focalY: 80,
    })
  })

  test.for([
    { name: 'a value the schema rejects', draft: false, transforms: { crop: 'not-a-crop' } },
    { name: 'a value JSON cannot store', draft: false, transforms: { contractScore: Number.NaN } },
    {
      name: 'a value the schema rejects, on a draft save',
      draft: true,
      transforms: { crop: 'not-a-crop' },
    },
  ])(
    'should reject a _transforms change with $name and keep the stored document and file',
    async ({ draft, transforms }, { payload }) => {
      const created = await createNote({ payload })

      await expect(
        payload.update({
          id: created.id,
          collection: contractMediaSlug,
          context: { contractStages: { first: setTransforms(transforms) } },
          data: {},
          draft,
          file: textFile('replacement'),
        }),
      ).rejects.toThrow(TransformerContractError)

      const stored = await payload.findByID({ id: created.id, collection: contractMediaSlug })

      expect(stored.filename).toBe(created.filename)
      expect(stored._transforms).toBeNull()
      expect(await readFile(path.join(contractMediaDir, created.filename!), 'utf8')).toBe('hello')
    },
  )

  // Regression for a bug in #18601, where bulk updates and updates by ID resolved transformer
  // changes differently.
  test('should give a bulk update the same result as an update by ID', async ({ payload }) => {
    const first = await createNote({ payload })
    const second = await createNote({ payload })
    const context = { contractStages: { first: setTransforms({ contractScore: 1 }) } }
    const update = { collection: contractMediaSlug, context, data: {}, file: textFile('new') }

    const updatedByID = await payload.update({ ...update, id: first.id })
    const bulkUpdated = await payload.update({ ...update, where: { id: { equals: second.id } } })

    expect(bulkUpdated.errors).toEqual([])
    expect(bulkUpdated.docs[0]?._transforms).toEqual(updatedByID._transforms)
    expect(updatedByID._transforms).toEqual({ contractScore: 1 })
  })

  // Regression for a bug in #18601, where removing a group skipped its required fields. The unit
  // tests of transformUploadFile cover the other field changes.
  test('should reject the removal of a group with required fields with a TransformerContractError and save nothing', async ({
    payload,
  }) => {
    const result = createNote({
      contractStages: { first: ({ doc }) => void delete doc.details },
      payload,
    })

    await expect(result).rejects.toThrow(TransformerContractError)
    await expect(result).rejects.toThrow('"contract-first" transformer changed a document field')

    const { totalDocs } = await payload.count({ collection: contractMediaSlug })

    expect(totalDocs).toBe(0)
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

  test('should rebuild from the original when a claimed key changes, with the stored MIME type', async ({
    payload,
  }) => {
    const contractStages = {
      first: appendSuffixToOriginal,
      handledTransformKeys: ['contractSuffix'],
    }
    const created = await createNote({
      _transforms: { contractSuffix: '!' },
      contractStages,
      payload,
    })

    resetContractCalls()

    // Markdown has no file signature, so a rebuild cannot read the type from the stored bytes.
    const updated = await payload.update({
      id: created.id,
      collection: contractMediaSlug,
      context: { contractStages },
      data: { _transforms: { contractSuffix: '?' } },
    })

    expect(contractCalls.transformFile[0]?.source.mimeType).toBe('text/markdown')
    expect(updated.mimeType).toBe('text/markdown')
    expect(await readFile(path.join(contractMediaDir, updated.filename!), 'utf8')).toBe('hello?')
  })

  test('should reject a built-in key that a stage adds and no transformer claims, and save nothing', async ({
    payload,
  }) => {
    const crop = { height: 1, width: 1, x: 0, y: 0 }

    await expect(
      createNote({ contractStages: { first: setTransforms({ crop }) }, payload }),
    ).rejects.toMatchObject({ data: { errors: [{ path: '_transforms.crop' }] } })

    const { totalDocs } = await payload.count({ collection: contractMediaSlug })

    expect(totalDocs).toBe(0)
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

    test('should pass a stage its own canTransform options in every task, not the Sharp task', async ({
      payload,
    }) => {
      await createImage({ contractStages: {}, payload })

      // One stage in the main task and in the thumbnail task.
      expect(contractCalls.transformFile.map(({ options }) => options)).toEqual([
        { stage: 'first' },
        { stage: 'first' },
      ])
    })

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

      const calls = contractCalls.transformFile

      expect(created._transforms).toEqual({ contractScore: 1 })
      expect(calls.map(({ doc }) => Object.isFrozen(doc))).toEqual([false, true])
      expect(calls[1]?.docAtStart._transforms).toEqual({ contractScore: 1 })
    })

    test('should reject a doc change from a size task', async ({ payload }) => {
      await expect(
        createImage({ contractStages: { first: setTransforms({ contractScore: 1 }) }, payload }),
      ).rejects.toThrow()

      const { totalDocs } = await payload.count({
        collection: variantMediaSlug,
        overrideAccess: true,
      })

      expect(totalDocs).toBe(0)
    })
  })
})
