import type { Field } from '../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { flattenAllFields } from './flattenAllFields.js'

describe('flattenAllFields', () => {
  it('should return the cached result for the same fields array', () => {
    const fields: Field[] = [{ name: 'title', type: 'text' }]

    expect(flattenAllFields({ cache: true, fields })).toBe(
      flattenAllFields({ cache: true, fields }),
    )
  })

  it('should not keep fields arrays alive once they are no longer referenced', async () => {
    const fieldsRef = flattenTemporaryFields()

    // WeakRef targets are kept alive until the current job finishes
    await new Promise((resolve) => setTimeout(resolve, 0))
    globalThis.gc!()

    expect(fieldsRef.deref()).toBeUndefined()
  })
})

/**
 * Flattens a fields array that nothing else references, like the fresh arrays
 * `buildVersionCollectionFields` returns on every call.
 */
function flattenTemporaryFields(): WeakRef<Field[]> {
  const fields: Field[] = [
    { name: 'title', type: 'text' },
    {
      name: 'group',
      type: 'group',
      fields: [{ name: 'nested', type: 'text' }],
    },
  ]

  flattenAllFields({ cache: true, fields })

  return new WeakRef(fields)
}
