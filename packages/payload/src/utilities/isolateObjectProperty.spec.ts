import { describe, expect, it } from 'vitest'

import { isolateObjectProperty } from './isolateObjectProperty.js'

describe('isolateObjectProperty', () => {
  describe('basic isolation behavior', () => {
    it('should isolate specified property from the original object', () => {
      const original = { a: 1, b: 2 }
      const proxy = isolateObjectProperty(original, 'a')

      proxy.a = 100

      expect(proxy.a).toBe(100)
      expect(original.a).toBe(1) // Original unchanged
    })

    it('should share non-isolated properties with the original object', () => {
      const original = { a: 1, b: 2 }
      const proxy = isolateObjectProperty(original, 'a')

      proxy.b = 200

      expect(proxy.b).toBe(200)
      expect(original.b).toBe(200) // Original also changed
    })

    it('should support isolating multiple properties', () => {
      const original = { a: 1, b: 2, c: 3 }
      const proxy = isolateObjectProperty(original, ['a', 'b'])

      proxy.a = 100
      proxy.b = 200

      expect(proxy.a).toBe(100)
      expect(proxy.b).toBe(200)
      expect(original.a).toBe(1)
      expect(original.b).toBe(2)
    })

    it('should support deleting isolated properties', () => {
      const original: Record<string, any> = { a: 1, b: 2 }
      const proxy = isolateObjectProperty(original, 'a')

      delete proxy.a

      expect('a' in proxy).toBe(false)
      expect('a' in original).toBe(true) // Original still has it
    })

    it('should support "in" operator for isolated properties', () => {
      const original: Record<string, any> = { a: 1, b: 2 }
      const proxy = isolateObjectProperty(original, 'a')

      expect('a' in proxy).toBe(true)
      expect('b' in proxy).toBe(true)

      delete proxy.a
      expect('a' in proxy).toBe(false)
    })
  })

  describe('private field access (Node 24+ compatibility)', () => {
    /**
     * Class with private fields to test that the proxy correctly handles
     * getters/setters that access private fields (Node 24+ compatibility).
     */
    class ObjectWithPrivateFields {
      #privateValue: string

      constructor(value: string) {
        this.#privateValue = value
      }

      get value(): string {
        return this.#privateValue
      }

      set value(newValue: string) {
        this.#privateValue = newValue
      }
    }

    it('should allow reading properties via getters that access private fields when not isolated', () => {
      const original = new ObjectWithPrivateFields('secret')

      expect(original.value).toBe('secret')
    })

    it('should allow reading properties via getters that access private fields', () => {
      const original = new ObjectWithPrivateFields('secret')
      const proxy = isolateObjectProperty(original, 'nonExistentKey' as keyof typeof original)

      // This would throw "Cannot read private member" if receiver is wrong
      expect(proxy.value).toBe('secret')
    })

    it('should allow writing properties via setters that access private fields', () => {
      const original = new ObjectWithPrivateFields('secret')
      const proxy = isolateObjectProperty(original, 'nonExistentKey' as keyof typeof original)

      // This would throw "Cannot write private member" if receiver is wrong
      proxy.value = 'updated'

      expect(proxy.value).toBe('updated')
      expect(original.value).toBe('updated')
    })

    it('should work with Headers-like objects (simulating Request.headers)', () => {
      // Simulate a Request-like object with headers
      class MockRequest {
        #headers: Headers

        constructor() {
          this.#headers = new Headers({ 'content-type': 'application/json' })
        }

        get headers(): Headers {
          return this.#headers
        }
      }

      const request = new MockRequest()
      const proxy = isolateObjectProperty(request, 'nonExistentKey' as keyof typeof request)

      // This simulates what happens in createLocalReq when checking req.headers
      expect(proxy.headers).toBeInstanceOf(Headers)
      expect(proxy.headers.get('content-type')).toBe('application/json')
    })
  })
})
