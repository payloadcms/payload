import { describe, expect, it } from 'vitest'

import { serializeForRsc } from './serializeForRsc.js'
import { createServerFunctionClient } from './serverFunctionClient.js'
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

  it('should preserve native serializable values in server function args', async () => {
    const date = new Date()
    const regexp = /value/g
    const args = { date, regexp }
    let received: unknown

    const serverFunction = createServerFunctionClient({
      runServerFn: async ({ data }) => {
        received = data.args
        return null
      },
    })

    await serverFunction({ name: 'test', args })

    expect(received).toEqual(args)
    expect((received as typeof args).date).toBe(date)
    expect((received as typeof args).regexp).toBe(regexp)
  })
})
