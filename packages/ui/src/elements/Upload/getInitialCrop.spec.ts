import { describe, expect, it } from 'vitest'

import { getInitialCrop } from './getInitialCrop.js'

const original = { height: 3000, width: 4000 }

describe('getInitialCrop', () => {
  it('should open the editor with the saved crop as percentages of the original', () => {
    const crop = getInitialCrop({
      data: { _transforms: { crop: { height: 1200, width: 2000, x: 400, y: 450 } }, original },
    })

    expect(crop).toEqual({ height: 40, unit: '%', width: 50, x: 10, y: 15 })
  })

  it('should prefer an unsaved crop from the current editing session', () => {
    const unsaved = { height: 10, unit: '%' as const, width: 10, x: 0, y: 0 }

    const crop = getInitialCrop({
      data: { _transforms: { crop: { height: 1200, width: 2000, x: 400, y: 450 } }, original },
      uploadEdits: { crop: unsaved },
    })

    expect(crop).toBe(unsaved)
  })

  it('should not open the editor with the saved crop after a new file is selected', () => {
    const crop = getInitialCrop({
      data: { _transforms: { crop: { height: 1200, width: 2000, x: 400, y: 450 } }, original },
      hasSelectedFile: true,
    })

    expect(crop).toBeUndefined()
  })

  it('should return nothing when no crop is saved', () => {
    expect(getInitialCrop({ data: { _transforms: null, original } })).toBeUndefined()
  })

  it('should return nothing when the original size is unknown', () => {
    const crop = getInitialCrop({
      data: { _transforms: { crop: { height: 10, width: 10, x: 0, y: 0 } } },
    })

    expect(crop).toBeUndefined()
  })
})
