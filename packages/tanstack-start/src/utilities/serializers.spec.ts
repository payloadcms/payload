import { describe, expect, it } from 'vitest'

import { stripUnserializable } from './serverFunctionClient.js'

describe('TanStack serializers', () => {
  it('should copy special JSON keys as own data', () => {
    const input = JSON.parse('{"__proto__":{"label":"value"}}')
    const result = stripUnserializable(input)

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.hasOwn(result, '__proto__')).toBe(true)
    expect(Reflect.get(result, '__proto__')).toEqual({ label: 'value' })
    expect(Reflect.get(result, 'label')).toBeUndefined()
  })
})
