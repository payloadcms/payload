import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../../../types/index.js'

import { resolveUploadEdits } from './resolveUploadEdits.js'

const original = { height: 1000, width: 2000 }
const crop = { height: 500, width: 1000, x: 200, y: 100 }

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
    req: { file, query: {} } as unknown as PayloadRequest,
  })

/** A document whose focal point is saved in `_transforms`, with the rounded `focalX`. */
const focalAt = (x: number, y: number) => ({
  _transforms: { focalPoint: { x, y } },
  focalX: Math.round(x),
  focalY: y,
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
