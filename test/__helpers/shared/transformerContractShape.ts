import type { UploadTransformer } from 'payload'

import { describe, expect, it } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { validateTransformers } from '../../../packages/payload/src/uploads/transformers/validateTransformers.js'

/**
 * Generic `UploadTransformer` conformance checks, reusing core's own startup
 * validator so this stays in lockstep with the real contract. Call from a
 * transformer package's test suite against a real instance it constructs.
 */
export function runTransformerContractShapeTests(
  makeTransformer: () => Promise<UploadTransformer> | UploadTransformer,
): void {
  describe('transformer contract shape', () => {
    it('should declare a non-empty slug and at least one well-formed MIME pattern', async () => {
      const transformer = await makeTransformer()

      expect(() => validateTransformers({ transformers: [transformer] })).not.toThrow()
      expect(transformer.slug.trim().length).toBeGreaterThan(0)
      expect(transformer.mimeTypes.length).toBeGreaterThan(0)
    })

    it('should only declare capabilities (canTransform/handleRequest/transformFile/init) as functions', async () => {
      const transformer = await makeTransformer()

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
