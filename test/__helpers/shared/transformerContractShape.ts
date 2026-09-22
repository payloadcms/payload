import type { Payload, UploadTransformer } from 'payload'

import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { validateTransformers } from '../../../packages/payload/src/uploads/transformers/validateTransformers.js'
import { test } from '../int/vitest.js'

/**
 * Generic `UploadTransformer` conformance checks, reusing core's own startup
 * validator so this stays in lockstep with the real contract. Call from a
 * transformer package's test suite against a real instance it constructs.
 */
export function runTransformerContractShapeTests(
  makeTransformer: (payload: Payload) => Promise<UploadTransformer> | UploadTransformer,
): void {
  test.describe('transformer contract shape', () => {
    test('should declare a non-empty slug and at least one well-formed MIME pattern', async ({
      payload,
    }) => {
      const transformer = await makeTransformer(payload)

      expect(() => validateTransformers({ transformers: [transformer] })).not.toThrow()
      expect(transformer.slug.trim().length).toBeGreaterThan(0)
      expect(transformer.mimeTypes.length).toBeGreaterThan(0)
    })

    test('should only declare capabilities (canTransform/handleRequest/transformFile/init) as functions', async ({
      payload,
    }) => {
      const transformer = await makeTransformer(payload)

      for (const capability of [
        'canTransform',
        'handleRequest',
        'transformFile',
        'init',
      ] as const) {
        const value = transformer[capability]
        if (value !== undefined) {
          expect(typeof value).toBe('function')
        }
      }
    })
  })
}
