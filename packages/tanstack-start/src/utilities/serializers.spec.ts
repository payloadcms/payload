import { describe, expect, it } from 'vitest'

import { serializeForRsc } from './serializeForRsc.js'
import { stripUnserializable } from './serverFunctionClient.js'
import { toSerializable } from './toSerializable.js'

describe('TanStack serializers', () => {
  it('should copy special JSON keys as own data', async () => {
    const input = JSON.parse('{"__proto__":{"label":"value"}}')
    const results = [
      toSerializable(input),
      stripUnserializable(input),
      await serializeForRsc(input),
    ]

    for (const result of results) {
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
      expect(Object.hasOwn(result, '__proto__')).toBe(true)
      expect(Reflect.get(result, '__proto__')).toEqual({ label: 'value' })
      expect(Reflect.get(result, 'label')).toBeUndefined()
    }
  })
})
