import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { assertDataIsObject } from './assertDataIsObject.js'

const file = { name: 'a.txt' } as PayloadRequest['file']

describe('assertDataIsObject', () => {
  it.each([{}, { title: 'x' }])('accepts object %j', (data) => {
    expect(() => assertDataIsObject(data, {})).not.toThrow()
  })

  it.each([null, undefined, [], [1, 2], 'str', 123, true])('rejects %j with 400', (data) => {
    expect(() => assertDataIsObject(data, {})).toThrow(expect.objectContaining({ status: 400 }))
  })

  it('allows missing data for a file-only upload on an upload collection', () => {
    expect(() => assertDataIsObject(undefined, { file }, true)).not.toThrow()
  })

  it('rejects missing data with 400 when a file is present on a non-upload collection or global', () => {
    expect(() => assertDataIsObject(undefined, { file })).toThrow(
      expect.objectContaining({ status: 400 }),
    )
    expect(() => assertDataIsObject(undefined, { file }, false)).toThrow(
      expect.objectContaining({ status: 400 }),
    )
  })

  it.each([null, [], 'str'])('still rejects %j when a file is present on an upload collection', (data) => {
    expect(() => assertDataIsObject(data, { file }, true)).toThrow(
      expect.objectContaining({ status: 400 }),
    )
  })
})
