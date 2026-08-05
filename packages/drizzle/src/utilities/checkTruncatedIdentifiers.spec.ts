import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { checkTruncatedIdentifiers } from './checkTruncatedIdentifiers.js'
import { maxIdentifierLength } from './validateIdentifierLength.js'

const buildAdapter = (
  rawTables: DrizzleAdapter['rawTables'],
  warn: (...args: any[]) => void = () => {},
): Pick<DrizzleAdapter, 'payload' | 'rawTables'> =>
  ({
    payload: { logger: { warn } },
    rawTables,
  }) as unknown as Pick<DrizzleAdapter, 'payload' | 'rawTables'>

const longName = (char: string) => char.repeat(maxIdentifierLength + 1)

describe('checkTruncatedIdentifiers', () => {
  it('should neither warn nor throw when all identifiers fit within the limit', () => {
    const warn = vi.fn()

    const adapter = buildAdapter(
      {
        posts: {
          name: 'posts',
          columns: {
            id: { name: 'id', type: 'serial' },
            title: { name: 'title', type: 'text' },
          },
        },
      },
      warn,
    )

    expect(() => checkTruncatedIdentifiers({ adapter, logWarnings: true })).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
  })

  it('should warn (not throw) for a single over-long column name', () => {
    const columnName = longName('a')
    const warn = vi.fn()

    const adapter = buildAdapter(
      {
        posts: {
          name: 'posts',
          columns: {
            overflow: { name: columnName, type: 'text' },
          },
        },
      },
      warn,
    )

    expect(() => checkTruncatedIdentifiers({ adapter, logWarnings: true })).not.toThrow()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain(columnName)
  })

  it('should not warn when logWarnings is false', () => {
    const warn = vi.fn()

    const adapter = buildAdapter(
      {
        posts: {
          name: 'posts',
          columns: {
            overflow: { name: longName('a'), type: 'text' },
          },
        },
      },
      warn,
    )

    expect(() => checkTruncatedIdentifiers({ adapter, logWarnings: false })).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
  })

  it('should throw when two columns in the same table truncate to the same name', () => {
    // Differ only past the 63rd character, so both truncate to the same identifier.
    const shared = 'a'.repeat(maxIdentifierLength)

    const adapter = buildAdapter({
      posts: {
        name: 'posts',
        columns: {
          first: { name: `${shared}_one`, type: 'text' },
          second: { name: `${shared}_two`, type: 'text' },
        },
      },
    })

    expect(() => checkTruncatedIdentifiers({ adapter, logWarnings: true })).toThrow(
      'truncate to the same name',
    )
  })

  it('should throw on a collision even when logWarnings is false', () => {
    const shared = 'a'.repeat(maxIdentifierLength)

    const adapter = buildAdapter({
      posts: {
        name: 'posts',
        columns: {
          first: { name: `${shared}_one`, type: 'text' },
          second: { name: `${shared}_two`, type: 'text' },
        },
      },
    })

    expect(() => checkTruncatedIdentifiers({ adapter, logWarnings: false })).toThrow()
  })

  it('should not treat same-named columns in different tables as a collision', () => {
    const shared = 'a'.repeat(maxIdentifierLength)
    const warn = vi.fn()

    const adapter = buildAdapter(
      {
        posts: {
          name: 'posts',
          columns: {
            overflow: { name: `${shared}_one`, type: 'text' },
          },
        },
        pages: {
          name: 'pages',
          columns: {
            overflow: { name: `${shared}_two`, type: 'text' },
          },
        },
      },
      warn,
    )

    expect(() => checkTruncatedIdentifiers({ adapter, logWarnings: true })).not.toThrow()
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('should throw when two table names truncate to the same name', () => {
    const shared = 'a'.repeat(maxIdentifierLength)

    const adapter = buildAdapter({
      [`${shared}_one`]: {
        name: `${shared}_one`,
        columns: { id: { name: 'id', type: 'serial' } },
      },
      [`${shared}_two`]: {
        name: `${shared}_two`,
        columns: { id: { name: 'id', type: 'serial' } },
      },
    })

    expect(() => checkTruncatedIdentifiers({ adapter, logWarnings: true })).toThrow(
      'truncate to the same name',
    )
  })
})
