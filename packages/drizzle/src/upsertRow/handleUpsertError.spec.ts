import { ValidationError } from 'payload'
import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { handleUpsertError } from './handleUpsertError.js'

const adapter = { fieldConstraints: {} } as unknown as DrizzleAdapter

describe('handleUpsertError', () => {
  it('preserves the failing sub-table name on the ValidationError', () => {
    const pgError = {
      code: '23505',
      constraint: 'ultrasonic_avail_country_pkey',
      detail: 'Key (id)=(6a27e2a63f4b64567370f595) already exists.',
    }

    let thrown: unknown
    try {
      handleUpsertError({
        adapter,
        collectionSlug: 'ultrasonic',
        error: pgError,
        tableName: 'ultrasonic_avail_country',
      })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ValidationError)
    const validationError = thrown as ValidationError
    const fieldError = validationError.data.errors[0]!
    expect(fieldError.path).toBe('id')
    expect(fieldError.tableName).toBe('ultrasonic_avail_country')
  })

  it('recognizes SQLite unique violations reported through extendedCode', () => {
    // @libsql/client 0.17+ shape: base code in `code`, specific code in `extendedCode`
    const libsqlError = {
      code: 'SQLITE_CONSTRAINT',
      extendedCode: 'SQLITE_CONSTRAINT_UNIQUE',
      message: 'SQLITE_CONSTRAINT: UNIQUE constraint failed: posts.slug',
    }

    let thrown: unknown
    try {
      handleUpsertError({
        adapter,
        collectionSlug: 'posts',
        error: { cause: libsqlError },
        tableName: 'posts',
      })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ValidationError)
    expect((thrown as ValidationError).data.errors[0]!.path).toBe('slug')
  })

  it('re-throws non unique-constraint errors unchanged', () => {
    const otherError = new Error('some other db error')

    expect(() =>
      handleUpsertError({
        adapter,
        collectionSlug: 'ultrasonic',
        error: otherError,
        tableName: 'ultrasonic_avail_country',
      }),
    ).toThrow(otherError)
  })
})
