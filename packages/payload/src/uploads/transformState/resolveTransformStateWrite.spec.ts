import { describe, expect, it } from 'vitest'

import { resolveTransformStateWrite } from './resolveTransformStateWrite.js'

describe('resolveTransformStateWrite', () => {
  const originalDoc = { _transforms: { rotate: { angle: 90 }, custom: { mode: 'a' } } }

  it('should preserve omitted state', () => {
    expect(resolveTransformStateWrite({ data: {}, originalDoc }).value).toEqual(
      originalDoc._transforms,
    )
    expect(resolveTransformStateWrite({ data: {}, originalDoc }).hasChanged).toBe(false)
  })

  it('should replace the complete object and remove omitted keys', () => {
    expect(
      resolveTransformStateWrite({ data: { _transforms: { custom: 'b' } }, originalDoc }).value,
    ).toEqual({ custom: 'b' })
  })

  it.each([null, {}])('should clear state with %j', (_transforms) => {
    expect(resolveTransformStateWrite({ data: { _transforms }, originalDoc }).value).toBeNull()
  })

  it('should clear omitted state when replacing the original', () => {
    expect(
      resolveTransformStateWrite({ data: {}, isReplacingOriginal: true, originalDoc }).value,
    ).toBeNull()
  })

  it('should preserve explicit state for a replacement original', () => {
    expect(
      resolveTransformStateWrite({
        data: { _transforms: { custom: 1 } },
        isReplacingOriginal: true,
        originalDoc,
      }).value,
    ).toEqual({ custom: 1 })
  })

  it('should treat reordered object keys as unchanged', () => {
    expect(
      resolveTransformStateWrite({
        data: { _transforms: { custom: { mode: 'a' }, rotate: { angle: 90 } } },
        originalDoc,
      }).hasChanged,
    ).toBe(false)
  })
})
