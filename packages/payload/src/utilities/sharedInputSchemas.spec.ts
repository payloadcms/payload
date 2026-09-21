import * as z from 'zod/mini'
import { describe, expect, it } from 'vitest'

import { overrideAccessSchema } from './sharedInputSchemas.js'

describe('overrideAccessSchema', () => {
  it('should default to false', () => {
    expect(z.parse(overrideAccessSchema, undefined)).toBe(false)
  })
})
