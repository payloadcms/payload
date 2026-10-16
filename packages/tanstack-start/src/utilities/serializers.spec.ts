import { describe, expect, it } from 'vitest'

import { serializeForRsc } from './serializeForRsc.js'
import { createServerFunctionClient } from './serverFunctionClient.js'
import { stripUnserializable } from './stripUnserializable.js'
import { toSerializable } from './toSerializable.js'

describe('TanStack serializers', () => {
  it('should copy special JSON keys as own data', async () => {
    const input = JSON.parse('{"__proto__":{"label":"value"}}')
    const results = [toSerializable(input), await serializeForRsc(input)]

    for (const result of results) {
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
      expect(Object.hasOwn(result, '__proto__')).toBe(true)
      expect(Reflect.get(result, '__proto__')).toEqual({ label: 'value' })
      expect(Reflect.get(result, 'label')).toBeUndefined()
    }
  })

  it('should strip unsupported values while preserving native serializable values', async () => {
    const date = new Date()
    const regexp = /value/g
    const blob = new Blob(['file'])
    const args = { date, regexp, blob }
    let received: unknown

    const serverFunction = createServerFunctionClient({
      runServerFn: async ({ data }) => {
        received = data.args
        return null
      },
    })

    await serverFunction({ name: 'test', args })

    expect(received).toEqual({ date, regexp })
    expect((received as typeof args).date).toBe(date)
    expect((received as typeof args).regexp).toBe(regexp)
  })

  it('should preserve sparse array indexes and length', () => {
    const input: unknown[] = []
    input[2] = 'last'

    const result = stripUnserializable(input) as unknown[]

    expect(result).toHaveLength(3)
    expect(Object.hasOwn(result, '0')).toBe(false)
    expect(Object.hasOwn(result, '1')).toBe(false)
    expect(result[2]).toBe('last')
  })

  it('should preserve sparse RSC array holes and explicit undefined values', async () => {
    const input: unknown[] = []
    input[2] = 'value'
    input[3] = undefined
    input.length = 5

    const result = await serializeForRsc(input)

    expect(result).toHaveLength(5)
    expect(Object.hasOwn(result, '0')).toBe(false)
    expect(Object.hasOwn(result, '1')).toBe(false)
    expect(result[2]).toBe('value')
    expect(Object.hasOwn(result, '3')).toBe(true)
    expect(result[3]).toBeUndefined()
    expect(Object.hasOwn(result, '4')).toBe(false)
  })

  it.each([Symbol('data'), Symbol.for('react.portal')])(
    'should serialize objects tagged with %s as data',
    async ($$typeof) => {
      const input = { $$typeof, label: 'value' }

      expect(await serializeForRsc(input)).toEqual({ label: 'value' })
    },
  )

  it('should serialize arrays of symbol-tagged objects as data', async () => {
    const input = [{ $$typeof: Symbol('data'), label: 'value' }]

    expect(await serializeForRsc(input)).toEqual([{ label: 'value' }])
  })

  it('should strip unsupported values from maps and sets', () => {
    const input = {
      map: new Map<string, unknown>([
        ['valid', 'value'],
        ['callback', () => undefined],
      ]),
      set: new Set<unknown>(['valid', () => undefined]),
    }

    const result = stripUnserializable(input) as typeof input

    expect(result.map).toEqual(new Map([['valid', 'value']]))
    expect(result.set).toEqual(new Set(['valid']))
  })

  it('should preserve shared references across records, arrays, maps, and sets', () => {
    const item = { id: 'selected' }
    const selected = new Set([item])
    const input = {
      item,
      items: [item],
      map: new Map([[item, item]]),
      selected,
      selectedAlias: selected,
    }

    const result = stripUnserializable(input) as typeof input

    expect(result.items[0]).toBe(result.item)
    expect(result.map.get(result.item)).toBe(result.item)
    expect(result.selected.has(result.item)).toBe(true)
    expect(result.selectedAlias).toBe(result.selected)
  })

  it('should preserve undefined map keys while stripping unsupported keys', () => {
    const callback = () => undefined
    const symbol = Symbol('key')
    const input = new Map<unknown, string>([
      [undefined, 'default'],
      [callback, 'callback'],
      [symbol, 'symbol'],
    ])

    const result = stripUnserializable(input) as typeof input

    expect(result).toEqual(new Map([[undefined, 'default']]))
  })
})
