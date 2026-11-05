import * as z from 'zod/mini'
import { describe, expect, it } from 'vitest'

import { overrideAccessSchema } from './sharedInputSchemas.js'

describe('overrideAccessSchema', () => {
  it('should default to true for trusted local tools', () => {
    expect(z.parse(overrideAccessSchema, undefined)).toBe(true)
  })
})
