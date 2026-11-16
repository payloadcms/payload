import { describe, expect, it } from 'vitest'

import { applyLegacyEdits, toPipelineEdits, withSavedEdits } from './legacyUploadEdits.js'

const original = { height: 1000, width: 2000 }
const center = { x: 50, y: 50 }
const crop = { height: 500, width: 1000, x: 200, y: 100 }

const legacyEdits = (args: Partial<Parameters<typeof applyLegacyEdits>[0]>) =>
  applyLegacyEdits({
    currentFocalPoint: center,
    isLegacyDocument: false,
    original,
    state: null,
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

describe('applyLegacyEdits', () => {
  it.each([
    {
      name: 'remove the crop when the admin crop selects the whole image',
      args: {
        adminCrop: { height: 100, unit: '%' as const, width: 100, x: 0, y: 0 },
        state: { crop, watermark: true },
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
      args: { isLegacyDocument: true, state: { crop }, submitted: { crop } },
      expected: { crop },
    },
    {
      name: 'not copy a focal point when the document is not legacy',
      args: { currentFocalPoint: { x: 30, y: 70 }, state: { crop }, submitted: { crop } },
      expected: { crop },
    },
  ])('should $name', ({ args, expected }) => {
    expect(legacyEdits(args)).toEqual(expected)
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
