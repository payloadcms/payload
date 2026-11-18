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

  it('allows missing data for a file-only upload', () => {
    expect(() => assertDataIsObject(undefined, { file })).not.toThrow()
  })

  it('still rejects null data when a file is present', () => {
    expect(() => assertDataIsObject(null, { file })).toThrow(
      expect.objectContaining({ status: 400 }),
    )
  })
})
