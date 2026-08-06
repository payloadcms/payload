import type { Serializable } from '@tanstack/react-router'

import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { toSerializable } from './toSerializable.js'

describe('toSerializable', () => {
  it('strips values that cannot cross the server function boundary', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular

    expect(
      toSerializable({
        circular,
        element: createElement('div'),
        fn: () => 'value',
        keep: 'value',
        regexp: /value/,
        symbol: Symbol('value'),
      }),
    ).toEqual({ circular: {}, keep: 'value' })
  })

  it('preserves values supported by the TanStack serializer', () => {
    const date = new Date('2026-08-06T00:00:00.000Z')
    const map = new Map([['key', 'value']])
    const set = new Set(['value'])
    const typedArray = new Uint8Array([1, 2, 3])

    const result = toSerializable({ date, map, set, typedArray })

    expect(result).toEqual({ date, map, set, typedArray })
  })

  it('adds trusted serializable values after sanitizing the source record', () => {
    // TanStack's real RSC handle is a function branded with private symbols.
    const providerHandle = (() => 'rendered-provider') as unknown as Serializable
    const result = toSerializable(
      {
        fn: () => 'value',
        keep: 'value',
      },
      { providers: providerHandle },
    )

    expect(result).toEqual({ keep: 'value', providers: providerHandle })
  })
})
