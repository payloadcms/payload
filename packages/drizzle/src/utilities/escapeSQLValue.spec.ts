import { describe, expect, it } from 'vitest'

import { escapeSQLValue } from './escapeSQLValue.js'

describe('escapeSQLValue', () => {
  it('should allow Unicode letters and numbers in JSON query values', () => {
    expect(escapeSQLValue('你好世界')).toBe('你好世界')
    expect(escapeSQLValue('café naïve Größe')).toBe('café naïve Größe')
    expect(escapeSQLValue('item １２３ @.+-:_')).toBe('item １２３ @.+-:_')
  })

  it('should reject SQL metacharacters in string values', () => {
    expect(() => escapeSQLValue("value' OR 1=1")).toThrow('is not allowed as a JSON query value')
    expect(() => escapeSQLValue('value; DROP TABLE users')).toThrow(
      'is not allowed as a JSON query value',
    )
    expect(() => escapeSQLValue('value/path')).toThrow('is not allowed as a JSON query value')
  })
})
