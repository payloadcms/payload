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

const suffixClaim: ContractStages = {
  claims: { first: ['contractSuffix'] },
  first: appendSuffixToOriginal,
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

  // Each case runs the pipeline once and gives the fields the working doc must have.
  const pipelineRuns = [
    {
      name: 'a create',
      expected: { alt: 'note', details: { caption: 'A note' } },
      run: async ({ payload }: { payload: Payload }) => {
        await createNote({ contractStages: {}, payload })
      },
    },
    {
      name: 'an update, with the stored fields merged in',
      expected: { alt: 'changed', details: { caption: 'A note' } },
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
  ]

  test.describe('transformFile arguments', () => {
    test('should pass the upload as source and originalSource', async ({ payload }) => {
      await createNote({ contractStages: {}, payload })

      expect(contractCalls.transformFile[0]).toMatchObject({
        originalSourceText: 'hello',
        source: { filename: 'note.md', mimeType: 'text/markdown', sizeInBytes: 5 },
        sourceText: 'hello',
      })
    })

    test.for(pipelineRuns)(
      'should pass the working doc, and a frozen copy of it as originalDoc, on $name',
      async ({ expected, run }, { payload }) => {
        await run({ payload })

        const call = contractCalls.transformFile[0]

        expect(call?.docAtStart).toMatchObject(expected)
        expect(call?.originalDoc).toEqual(call?.docAtStart)
        expect(call?.isDocFrozen).toBe(false)
        expect(call?.isOriginalDocFrozen).toBe(true)
      },
    )
  })

  test.for(pipelineRuns)(
    'should pass the working doc, and a frozen copy of it as originalDoc, to canTransform on $name',
    async ({ expected, run }, { payload }) => {
      await run({ payload })

      const call = contractCalls.canTransform.find(
        ({ collectionSlug, operation }) =>
          collectionSlug === contractMediaSlug && operation === 'upload',
      )

      expect(call?.doc).toMatchObject(expected)
      expect(call?.originalDoc).toEqual(call?.doc)
      expect(Object.isFrozen(call?.originalDoc)).toBe(true)
    },
  )

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
    test('should save a _transforms change after running beforeValidate and beforeChange hooks on it', async ({
      payload,
    }) => {
      const created = await createNote({
        contractStages: {
          claims: { first: ['contractScore'] },
          first: setTransforms({ contractScore: 1 }),
        },
        payload,
      })

      const stored = await payload.findByID({ id: created.id, collection: contractMediaSlug })

      expect(contractHookCalls).toEqual([
        { _transforms: { contractScore: 1 }, hook: 'beforeValidate' },
        { _transforms: { contractScore: 1 }, hook: 'beforeChange' },
      ])
      expect(created._transforms).toEqual({ contractScore: 1 })
      expect(stored._transforms).toEqual({ contractScore: 1 })
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
      const context = {
        contractStages: {
          claims: { first: ['contractScore'] },
          first: setTransforms({ contractScore: 1 }),
        },
      }

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

  test.describe('claimed _transforms keys', () => {
    const createSuffixedNote = ({
      contractStages = suffixClaim,
      payload,
      suffix = '!',
    }: {
      contractStages?: ContractStages
      payload: Payload
      suffix?: string
    }) =>
      payload.create({
        collection: contractMediaSlug,
        context: { contractStages },
        data: {
          _transforms: { contractSuffix: suffix },
          alt: 'note',
          details: { caption: 'A note' },
        },
        file: textFile('hello'),
      })

    const readStoredFile = (filename?: null | string) =>
      readFile(path.join(contractMediaDir, filename!), 'utf8')

    test('should give the claiming transformer the saved key to apply to the original', async ({
      payload,
    }) => {
      const created = await createSuffixedNote({ payload })

      expect(contractCalls.transformFile[0]?.docAtStart._transforms).toEqual({
        contractSuffix: '!',
      })
      expect(await readStoredFile(created.filename)).toBe('hello!')
    })

    test('should reject a saved key that no transformer claims, before any transformer runs', async ({
      payload,
    }) => {
      await expect(createSuffixedNote({ contractStages: {}, payload })).rejects.toThrow(
        /_transforms\.contractSuffix/,
      )

      expect(contractCalls.transformFile).toEqual([])
    })

    test('should reject a saved key that two transformers claim, naming both', async ({
      payload,
    }) => {
      const contractStages: ContractStages = {
        claims: { first: ['contractSuffix'], second: ['contractSuffix'] },
      }

      await expect(createSuffixedNote({ contractStages, payload })).rejects.toMatchObject({
        data: {
          errors: [
            {
              message: expect.stringMatching(/"contract-first".*"contract-second"/),
              path: '_transforms.contractSuffix',
            },
          ],
        },
      })

      expect(contractCalls.transformFile).toEqual([])
    })

    test('should reject a stage that changes a key another transformer claims, and save nothing', async ({
      payload,
    }) => {
      const contractStages: ContractStages = {
        claims: { second: ['contractSuffix'] },
        first: ({ doc }) => {
          doc._transforms = { ...doc._transforms, contractSuffix: '?' }
        },
      }

      await expect(createSuffixedNote({ contractStages, payload })).rejects.toThrow(
        /"contract-first".*_transforms\.contractSuffix.*"contract-second"/,
      )

      const { totalDocs } = await payload.count({ collection: contractMediaSlug })

      expect(totalDocs).toBe(0)
    })

    test('should reject a key that a stage adds and no transformer claims, and save nothing', async ({
      payload,
    }) => {
      await expect(
        createNote({
          contractStages: { first: setTransforms({ crop: { height: 1, width: 1, x: 0, y: 0 } }) },
          payload,
        }),
      ).rejects.toMatchObject({
        data: { errors: [expect.objectContaining({ path: '_transforms.crop' })] },
      })

      const { totalDocs } = await payload.count({ collection: contractMediaSlug })

      expect(totalDocs).toBe(0)
    })

    test('should accept a built-in key that a transformer claims', async ({ payload }) => {
      const created = await payload.create({
        collection: contractMediaSlug,
        context: { contractStages: { claims: { first: ['clip'] } } },
        data: {
          _transforms: { clip: { endMs: 1000, startMs: 0 } },
          alt: 'note',
          details: { caption: 'A note' },
        },
        file: textFile('hello'),
      })

      expect(created._transforms).toEqual({ clip: { endMs: 1000, startMs: 0 } })
    })

    test('should rebuild from the original when a claimed key changes, without stacking', async ({
      payload,
    }) => {
      const created = await createSuffixedNote({ payload })

      const firstChange = await payload.update({
        id: created.id,
        collection: contractMediaSlug,
        context: { contractStages: suffixClaim },
        data: { _transforms: { contractSuffix: '?' } },
      })
      const firstChangeText = await readStoredFile(firstChange.filename)
      const secondChange = await payload.update({
        id: created.id,
        collection: contractMediaSlug,
        context: { contractStages: suffixClaim },
        data: { _transforms: { contractSuffix: '#' } },
      })

      expect(firstChangeText).toBe('hello?')
      expect(await readStoredFile(secondChange.filename)).toBe('hello#')
    })

    test('should keep a key no transformer claims any more through an unrelated update', async ({
      payload,
    }) => {
      const created = await createSuffixedNote({ payload })
      resetContractCalls()

      const updated = await payload.update({
        id: created.id,
        collection: contractMediaSlug,
        context: { contractStages: {} },
        data: { alt: 'changed' },
      })

      expect(updated.alt).toBe('changed')
      expect(updated._transforms).toEqual({ contractSuffix: '!' })
      expect(contractCalls.transformFile).toEqual([])
      expect(await readStoredFile(updated.filename)).toBe('hello!')
    })

    test('should reject a rebuild of a key no transformer claims any more, before reading the original', async ({
      payload,
    }) => {
      const created = await createSuffixedNote({ payload })
      // Reading the original now would fail with a different error, so this proves the check
      // runs before Payload reads it.
      await rm(path.join(contractMediaDir, created.original!.filename))
      resetContractCalls()

      await expect(
        payload.update({
          id: created.id,
          collection: contractMediaSlug,
          context: { contractStages: {} },
          data: { _transforms: { contractSuffix: '?' } },
        }),
      ).rejects.toThrow(/_transforms\.contractSuffix/)

      const stored = await payload.findByID({ id: created.id, collection: contractMediaSlug })

      expect(contractCalls.transformFile).toEqual([])
      expect(stored._transforms).toEqual({ contractSuffix: '!' })
    })

    test('should rebuild an upload without an original once from its main file, then from that file', async ({
      payload,
    }) => {
      const created = await createSuffixedNote({ payload })
      // An upload made before File Versioning has no retained original.
      await payload.db.updateOne({
        id: created.id,
        collection: contractMediaSlug,
        data: {
          original: {
            _objectKey: null,
            filename: null,
            filesize: null,
            height: null,
            mimeType: null,
            prefix: null,
            url: null,
            width: null,
          },
        },
      })

      const firstChange = await payload.update({
        id: created.id,
        collection: contractMediaSlug,
        context: { contractStages: suffixClaim },
        data: { _transforms: { contractSuffix: '?' } },
      })
      const firstChangeText = await readStoredFile(firstChange.filename)
      const adoptedOriginalText = await readStoredFile(firstChange.original?.filename)
      const secondChange = await payload.update({
        id: created.id,
        collection: contractMediaSlug,
        context: { contractStages: suffixClaim },
        data: { _transforms: { contractSuffix: '#' } },
      })

      expect(firstChangeText).toBe('hello!?')
      expect(adoptedOriginalText).toBe('hello!')
      expect(await readStoredFile(secondChange.filename)).toBe('hello!#')
    })

    test('should save a focalPoint change that no transformer claims on a document with an unclaimed key', async ({
      payload,
    }) => {
      const created = await createSuffixedNote({ payload })
      resetContractCalls()

      const updated = await payload.update({
        id: created.id,
        collection: contractMediaSlug,
        context: { contractStages: {} },
        data: { _transforms: { contractSuffix: '!', focalPoint: { x: 20, y: 80 } } },
      })

      expect(updated._transforms).toEqual({ contractSuffix: '!', focalPoint: { x: 20, y: 80 } })
      expect(contractCalls.transformFile).toEqual([])
    })

    test('should save a focalPoint change that no transformer claims, without a rebuild', async ({
      payload,
    }) => {
      const created = await createNote({ payload })

      const updated = await payload.update({
        id: created.id,
        collection: contractMediaSlug,
        context: { contractStages: {} },
        data: { _transforms: { focalPoint: { x: 20, y: 80 } } },
      })

      expect(updated._transforms).toEqual({ focalPoint: { x: 20, y: 80 } })
      expect(contractCalls.transformFile).toEqual([])
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
          claims: { first: ['contractScore'] },
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
          contractStages: {
            claims: { first: ['contractScore'] },
            first: setTransforms({ contractScore: 1 }),
          },
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
