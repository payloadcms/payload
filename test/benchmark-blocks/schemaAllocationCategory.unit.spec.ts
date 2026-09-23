import { describe, expect, test } from 'vitest'

import {
  classifySchemaAllocation,
  createSchemaAllocationCounts,
} from './schemaAllocationCategory.js'

describe('MongoDB schema allocation categories', () => {
  test.each([
    ['array-group-tab', 'Error\n    at array (/workspace/models/buildSchema.ts:1:1)'],
    ['blocks-base', 'Error\n    at blocks (/workspace/models/buildSchema.ts:1:1)'],
    ['top-level', 'Error\n    at buildSchema (/workspace/models/buildSchema.ts:1:1)'],
    [
      'mongoose-internal',
      'Error\n    at Schema.clone (/workspace/node_modules/mongoose/lib/schema.js:1:1)',
    ],
    ['mongoose-internal', undefined],
  ] as const)('should classify %s allocations', (expectedCategory, stack) => {
    expect(classifySchemaAllocation({ stack })).toBe(expectedCategory)
  })

  test('should initialize only categories with a measured source', () => {
    expect(createSchemaAllocationCounts()).toEqual({
      'array-group-tab': 0,
      'blocks-base': 0,
      'discriminator-clone': 0,
      'mongoose-internal': 0,
      'top-level': 0,
    })
  })
})
