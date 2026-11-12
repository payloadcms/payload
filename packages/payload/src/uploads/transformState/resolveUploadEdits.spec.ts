import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'

import {
  resolveNextState,
  resolveUploadEdits,
  toPipelineEdits,
  withSavedEdits,
} from './resolveUploadEdits.js'

const original = { height: 1000, width: 2000 }
const center = { x: 50, y: 50 }
const crop = { height: 500, width: 1000, x: 200, y: 100 }

const nextState = (args: Partial<Parameters<typeof resolveNextState>[0]>) =>
  resolveNextState({
    currentFocalPoint: center,
    isLegacyDocument: false,
    original,
    previous: null,
    ...args,
  })

const pipelineEdits = (args: Partial<Parameters<typeof toPipelineEdits>[0]>) =>
  toPipelineEdits({
    hasFocalPointChange: false,
    hasNewFile: false,
    next: null,
    nextFocalPoint: center,
    original,
    parsedEdits: {},
    previous: null,
    ...args,
  })

const resolve = ({
  data,
  file,
  originalDoc,
}: {
  data: object
  file?: object
  originalDoc: object
}) =>
  resolveUploadEdits({
    collectionSlug: 'media',
    data,
    focalPointEnabled: true,
    operation: 'update',
    originalDoc,
    req: {
      file,
      payload: { config: { upload: { transformers: [] } } },
      query: {},
    } as unknown as PayloadRequest,
  })

/** A document whose focal point is saved in `_transforms`, with the rounded `focalX`. */
const focalAt = (x: number, y: number) => ({
  _transforms: { focalPoint: { x, y } },
  focalX: Math.round(x),
  focalY: y,
})

describe('resolveNextState', () => {
  it.each([
    { name: 'save an empty object as null', args: { submitted: {} }, expected: null },
    {
      name: 'replace the whole saved state with a submitted object',
      args: { previous: { crop, focalPoint: center }, submitted: { focalPoint: { x: 60, y: 70 } } },
      expected: { focalPoint: { x: 60, y: 70 } },
    },
    {
      name: 'remove the crop when the admin crop selects the whole image',
      args: {
        adminCrop: { height: 100, unit: '%' as const, width: 100, x: 0, y: 0 },
        previous: { crop, watermark: true },
      },
      expected: { watermark: true },
    },
    {
      name: 'not save a written focal point equal to the current one',
      args: { focalPointWrite: center },
      expected: null,
    },
    {
      name: 'not copy a legacy focal point at the center',
      args: { isLegacyDocument: true, submitted: { crop } },
      expected: { crop },
    },
    {
      name: 'not copy a focal point when the document is not legacy',
      args: { currentFocalPoint: { x: 30, y: 70 }, submitted: { crop } },
      expected: { crop },
    },
  ])('should $name', ({ args, expected }) => {
    expect(nextState(args)).toEqual(expected)
  })
})

describe('toPipelineEdits', () => {
  it('should send no crop when the saved crop did not change', () => {
    expect(pipelineEdits({ next: { crop }, previous: { crop } })).toEqual({})
  })

  it('should send the saved focal point with a changed crop, so sizes keep it', () => {
    const focalPoint = { x: 30, y: 70 }

    const edits = pipelineEdits({
      next: { crop, focalPoint },
      nextFocalPoint: focalPoint,
      previous: { crop: { ...crop, x: 0 }, focalPoint },
    })

    expect(edits).toMatchObject({ crop: { unit: '%' }, focalPoint })
  })

  it('should send the saved crop for a new file', () => {
    expect(pipelineEdits({ hasNewFile: true, next: { crop }, previous: { crop } })).toHaveProperty(
      'crop',
    )
  })

  it('should replace a parsed focal point with the resolved one', () => {
    const edits = pipelineEdits({
      nextFocalPoint: { x: 10, y: 90 },
      parsedEdits: { focalPoint: center },
    })

    expect(edits).toEqual({ focalPoint: { x: 10, y: 90 } })
  })

  it('should leave the edits unchanged when the original size is unknown', () => {
    expect(pipelineEdits({ next: { crop }, original: undefined })).toEqual({})
  })
})

describe('resolveUploadEdits', () => {
  const sparse: unknown[] = [1, , 3]
  Object.assign(sparse, { extra: true })
  const saved = { _transforms: { custom: true } }
  const center = { _transforms: null, focalX: 50, focalY: 50 }
  const replaced = { ...focalAt(20, 30), _transforms: { crop, focalPoint: { x: 20, y: 30 } } }
  // Saved before `_transforms` existed: the focal point is only in focalX and focalY.
  const legacy = { ...original, focalX: 30, focalY: 70 }

  it.each([
    {
      name: 'save a value in the form JSON stores it',
      data: { _transforms: { a: sparse, u: undefined } },
      saved: { _transforms: { a: [1, null, 3] } },
    },
    {
      name: 'keep the saved value when _transforms is undefined',
      data: { _transforms: undefined },
      doc: saved,
      saved,
    },
    {
      name: 'save focalX and focalY sent as strings',
      data: { focalX: '3', focalY: '7' },
      saved: focalAt(3, 7),
    },
    {
      name: 'save focalX sent without focalY',
      data: { focalX: 30 },
      doc: focalAt(10, 90),
      saved: focalAt(30, 90),
    },
    {
      name: 'save a focal point of 0',
      data: { focalX: 0, focalY: 90 },
      doc: focalAt(10, 90),
      saved: focalAt(0, 90),
    },
    // The admin sends the stored, rounded focalX and focalY again on every save.
    {
      name: 'keep a fractional focal point',
      data: { focalX: 33, focalY: 9 },
      doc: focalAt(33.3, 9),
      saved: focalAt(33.3, 9),
    },
    {
      name: 'prefer the _transforms focal point over focalX and focalY',
      data: { ...focalAt(10, 90), focalX: 50, focalY: 50 },
      saved: focalAt(10, 90),
    },
    {
      name: 'reset _transforms and the focal point on a file replace',
      data: {},
      doc: replaced,
      file: {},
      saved: center,
    },
    // A value equal to the replaced file's is not a new value.
    {
      name: 'reset a resent focal point on a file replace',
      data: { focalX: 20, focalY: 30 },
      doc: replaced,
      file: {},
      saved: center,
    },
    {
      name: 'keep a new focal point on a file replace',
      data: { focalX: 7, focalY: 1 },
      doc: replaced,
      file: {},
      saved: focalAt(7, 1),
    },
    {
      name: 'move a legacy focal point into _transforms on the first write',
      data: { _transforms: { crop } },
      doc: legacy,
      saved: { _transforms: { crop, focalPoint: { x: 30, y: 70 } }, focalX: 30, focalY: 70 },
    },
    {
      name: 'reset a legacy focal point when _transforms is null',
      data: { _transforms: null },
      doc: legacy,
      saved: center,
    },
  ])('should $name', async ({ data, doc = {}, file, saved }) => {
    const { applyTransformState } = await resolve({ data, file, originalDoc: doc })

    expect(applyTransformState({})).toStrictEqual(saved)
  })

  it('should give the pipeline the rounded focal point that focalX and focalY store', async () => {
    const { uploadEdits } = await resolve({
      data: { focalX: 33, focalY: 50 },
      originalDoc: focalAt(33.3, 50),
    })

    // An unrounded value differs from the sent focalX, which makes the pipeline reprocess the file.
    expect(uploadEdits.focalPoint).toEqual({ x: 33, y: 50 })
  })
})

describe('withSavedEdits', () => {
  // A rebuild that another key starts must apply the saved crop and focal point again, so the
  // sizes match the saved state.
  it.each([
    ['the saved focal point when the edits have none', {}, { x: 20, y: 80 }],
    [
      'the focal point of the edits over the saved one',
      { focalPoint: { x: 5, y: 5 } },
      { x: 5, y: 5 },
    ],
  ])('should use %s', (_name, edits, expectedFocalPoint) => {
    const savedEdits = withSavedEdits({
      edits,
      original,
      transforms: { crop, focalPoint: { x: 20, y: 80 } },
    })

    expect(savedEdits).toEqual({
      crop: { height: 50, unit: '%', width: 50, x: 10, y: 10 },
      focalPoint: expectedFocalPoint,
      heightInPixels: crop.height,
      widthInPixels: crop.width,
    })
  })
})
