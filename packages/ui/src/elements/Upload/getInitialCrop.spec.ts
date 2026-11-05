import { describe, expect, it } from 'vitest'

import { getInitialCrop } from './getInitialCrop.js'

const original = { height: 3000, width: 4000 }
const _transforms = { crop: { height: 1200, width: 2000, x: 400, y: 450 } }
const unsaved = { height: 10, unit: '%' as const, width: 10, x: 0, y: 0 }

describe('getInitialCrop', () => {
  it.each([
    {
      name: 'open the editor with the saved crop as percentages of the original',
      args: { data: { _transforms, original } },
      expected: { height: 40, unit: '%', width: 50, x: 10, y: 15 },
    },
    {
      name: 'prefer an unsaved crop from the current editing session',
      args: { data: { _transforms, original }, uploadEdits: { crop: unsaved } },
      expected: unsaved,
    },
    {
      name: 'not open the editor with the saved crop after a new file is selected',
      args: { data: { _transforms, original }, hasSelectedFile: true },
      expected: undefined,
    },
    {
      name: 'return nothing when no crop is saved',
      args: { data: { _transforms: null, original } },
      expected: undefined,
    },
    {
      name: 'return nothing when the original size is unknown',
      args: { data: { _transforms } },
      expected: undefined,
    },
  ])('should $name', ({ args, expected }) => {
    expect(getInitialCrop(args)).toEqual(expected)
  })
})
