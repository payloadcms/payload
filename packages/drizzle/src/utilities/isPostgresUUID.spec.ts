import { describe, expect, it } from 'vitest'

import { isPostgresUUID } from './isPostgresUUID.js'

describe('isPostgresUUID', () => {
  it('should accept RFC 4122 identifiers', () => {
    expect(isPostgresUUID('8cc2df6d-6e07-4da4-be48-5fa747c3b92b')).toBe(true)
    expect(isPostgresUUID('0199a0b4-5a29-7c1e-8f2b-2b6e9a1c4d77')).toBe(true)
  })

  it('should accept identifiers Postgres stores but RFC 4122 rejects', () => {
    // SQL Server NEWSEQUENTIALID(), as emitted by Dynamics/Dataverse - version nibble "f"
    expect(isPostgresUUID('117bd54e-c5aa-f111-aaab-7ced8d44b1d7')).toBe(true)
    // A variant nibble outside 8-b
    expect(isPostgresUUID('8cc2df6d-6e07-4da4-1e48-5fa747c3b92b')).toBe(true)
  })

  it('should be case insensitive', () => {
    expect(isPostgresUUID('117BD54E-C5AA-F111-AAAB-7CED8D44B1D7')).toBe(true)
  })

  it('should reject values a uuid column cannot be queried with', () => {
    expect(isPostgresUUID('invalid-something')).toBe(false)
    expect(isPostgresUUID('words partial')).toBe(false)
    expect(isPostgresUUID('')).toBe(false)
    expect(isPostgresUUID('8cc2df6d6e074da4be485fa747c3b92b')).toBe(false)
    expect(isPostgresUUID('8cc2df6d-6e07-4da4-be48-5fa747c3b92')).toBe(false)
    expect(isPostgresUUID('8cc2df6d-6e07-4da4-be48-5fa747c3b92bb')).toBe(false)
    expect(isPostgresUUID('8cc2df6d-6e07-4da4-be48-5fa747c3b92g')).toBe(false)
    expect(isPostgresUUID(1)).toBe(false)
    expect(isPostgresUUID(null)).toBe(false)
    expect(isPostgresUUID(undefined)).toBe(false)
  })
})
