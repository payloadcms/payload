import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'

import { resolveNextState, resolveUploadEdits, toPipelineEdits } from './resolveUploadEdits.js'

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

describe('resolveNextState', () => {
  it('should keep the previous state when nothing is submitted', () => {
    expect(nextState({ previous: { crop } })).toEqual({ crop })
  })

  it('should replace the previous state with the submitted one', () => {
    const next = nextState({ previous: { crop, watermark: true }, submitted: { watermark: false } })

    expect(next).toEqual({ watermark: false })
  })

  it('should clear the state when null is submitted', () => {
    expect(nextState({ previous: { crop }, submitted: null })).toBeNull()
  })

  it('should save an admin percent crop as original pixels', () => {
    const next = nextState({ adminCrop: { height: 50, unit: '%', width: 50, x: 10, y: 10 } })

    expect(next).toEqual({ crop: { height: 500, width: 1000, x: 200, y: 100 } })
  })

  it('should remove the crop when the admin crop selects the whole image', () => {
    const next = nextState({
      adminCrop: { height: 100, unit: '%', width: 100, x: 0, y: 0 },
      previous: { crop, watermark: true },
    })

    expect(next).toEqual({ watermark: true })
  })

  it('should save a written focal point that changes the current one', () => {
    expect(nextState({ focalPointWrite: { x: 30, y: 70 } })).toEqual({
      focalPoint: { x: 30, y: 70 },
    })
  })

  it('should not save a written focal point equal to the current one', () => {
    expect(nextState({ focalPointWrite: center })).toBeNull()
  })

  it('should prefer a submitted focal point over focalX and focalY', () => {
    const next = nextState({
      focalPointWrite: center,
      submitted: { focalPoint: { x: 10, y: 90 } },
    })

    expect(next).toEqual({ focalPoint: { x: 10, y: 90 } })
  })

  it('should copy a legacy focal point on the first write', () => {
    const next = nextState({
      currentFocalPoint: { x: 30, y: 70 },
      isLegacyDocument: true,
      submitted: { crop },
    })

    expect(next).toEqual({ crop, focalPoint: { x: 30, y: 70 } })
  })

  it('should not copy a legacy focal point at the center', () => {
    expect(nextState({ isLegacyDocument: true, submitted: { crop } })).toEqual({ crop })
  })

  it('should not copy a focal point when the document is not legacy', () => {
    const next = nextState({ currentFocalPoint: { x: 30, y: 70 }, submitted: { crop } })

    expect(next).toEqual({ crop })
  })

  it('should store an empty state as null', () => {
    expect(nextState({ submitted: {} })).toBeNull()
  })
})

describe('toPipelineEdits', () => {
  it('should pass a query crop to the pipeline as sent, including its output size', () => {
    const queryEdits = {
      crop: { height: 50, unit: '%' as const, width: 50, x: 0, y: 0 },
      heightInPixels: 40,
      widthInPixels: 40,
    }

    expect(pipelineEdits({ next: { crop }, parsedEdits: queryEdits })).toEqual(queryEdits)
  })

  it('should send a changed saved crop as a percent crop of the original', () => {
    expect(pipelineEdits({ next: { crop } })).toEqual({
      crop: { height: 50, unit: '%', width: 50, x: 10, y: 10 },
      heightInPixels: 500,
      widthInPixels: 1000,
    })
  })

  it('should send no crop when the saved crop did not change', () => {
    expect(pipelineEdits({ next: { crop }, previous: { crop } })).toEqual({})
  })

  it('should send the saved crop again when only the focal point changes', () => {
    const edits = pipelineEdits({
      hasFocalPointChange: true,
      next: { crop, focalPoint: { x: 30, y: 70 } },
      nextFocalPoint: { x: 30, y: 70 },
      previous: { crop },
    })

    expect(edits).toMatchObject({ crop: { unit: '%' }, focalPoint: { x: 30, y: 70 } })
  })

  it('should send the saved crop for a new file', () => {
    expect(pipelineEdits({ hasNewFile: true, next: { crop }, previous: null })).toHaveProperty(
      'crop',
    )
  })

  it('should send a full crop with the original size when the crop is removed', () => {
    expect(pipelineEdits({ previous: { crop } })).toEqual({
      crop: { height: 100, unit: '%', width: 100, x: 0, y: 0 },
      heightInPixels: 1000,
      widthInPixels: 2000,
    })
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
  it('should save a submitted value in the form JSON stores it', async () => {
    const sparse: unknown[] = [1, , 3]
    Object.assign(sparse, { extra: true })

    const { applyTransformState } = await resolveUploadEdits({
      collectionSlug: 'media',
      data: { _transforms: { custom: sparse, missing: undefined } },
      focalPointEnabled: false,
      operation: 'update',
      originalDoc: {},
      req: { query: {} } as unknown as PayloadRequest,
    })

    expect(applyTransformState({})._transforms).toStrictEqual({ custom: [1, null, 3] })
  })
})
