import type { FormState } from 'payload'
import type { ReactNode } from 'react'

import { describe, expect, it, vi } from 'vitest'

import { reduceToSerializableFields } from './reduceToSerializableFields.js'

describe('reduceToSerializableFields', () => {
  it('should remove non-serializable values from fields and array rows', () => {
    const circularValue: { self?: unknown } = {}

    circularValue.self = circularValue

    const rowLabel = circularValue as unknown as ReactNode
    const fields: FormState = {
      links: {
        customComponents: {
          Field: rowLabel,
        },
        rows: [
          {
            blockType: 'link',
            collapsed: true,
            customComponents: {
              RowLabel: rowLabel,
            },
            id: 'row-1',
          },
        ],
        validate: vi.fn(),
        value: 1,
      },
    }

    const result = reduceToSerializableFields(fields)

    expect(result).toEqual({
      links: {
        rows: [{ blockType: 'link', collapsed: true, id: 'row-1' }],
        value: 1,
      },
    })
    expect(() => JSON.stringify(result)).not.toThrow()
    expect(fields.links.rows?.[0].customComponents?.RowLabel).toBe(rowLabel)
  })
})
