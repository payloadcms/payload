import { describe, expect, it } from 'vitest'

import { maxIdentifierLength, validateIdentifierLength } from './validateIdentifierLength.js'

describe('validateIdentifierLength', () => {
  it('should return the name unchanged when at or under the 63-char limit', () => {
    const name = 'a'.repeat(maxIdentifierLength)

    expect(validateIdentifierLength(name)).toBe(name)
  })

  it('should throw when the name exceeds the 63-char limit', () => {
    const name = 'a'.repeat(maxIdentifierLength + 1)

    expect(() => validateIdentifierLength(name)).toThrow('Exceeded max identifier length')
  })

  it('should include the invalid name and the dbName tip in the error', () => {
    const name = `some_long_table_name${'x'.repeat(maxIdentifierLength)}_locales`

    expect(() => validateIdentifierLength(name)).toThrow(name)
    expect(() => validateIdentifierLength(name)).toThrow(
      'You can use the dbName property to reduce the table name length',
    )
  })
})
