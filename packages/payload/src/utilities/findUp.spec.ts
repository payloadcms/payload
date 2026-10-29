import path from 'path'
import { describe, expect, it } from 'vitest'

import { findUp, findUpSync } from './findUp'

const missingFileName = 'this-file-name-should-never-exist.payload-test'

// Relative to the process cwd rather than hardcoded, so these hold no matter
// where vitest is invoked from.
const relativeDir = path.relative(process.cwd(), import.meta.dirname) || '.'

describe('findUpSync', () => {
  // Note this cannot fail fast: the pre-fix behaviour is a synchronous infinite
  // loop, which blocks the worker thread and prevents any test timeout from
  // firing. A regression here hangs the run rather than failing an assertion.
  it('returns null for a relative dir when no match exists', () => {
    expect(findUpSync({ dir: relativeDir, fileNames: [missingFileName] })).toBeNull()
    expect(findUpSync({ dir: './', fileNames: [missingFileName] })).toBeNull()
  })

  it('returns null for an absolute dir when no match exists', () => {
    expect(findUpSync({ dir: import.meta.dirname, fileNames: [missingFileName] })).toBeNull()
  })

  it('finds a file in an ancestor of a relative dir', () => {
    expect(findUpSync({ dir: relativeDir, fileNames: ['package.json'] })).toBe(
      path.resolve(import.meta.dirname, '../../package.json'),
    )
  })
})

describe('findUp', () => {
  // The async variant awaits between iterations, so its loop does yield and a
  // regression here does surface as a timeout.
  it('returns null for a relative dir when no match exists', { timeout: 10000 }, async () => {
    await expect(findUp({ dir: relativeDir, fileNames: [missingFileName] })).resolves.toBeNull()
  })

  it('finds a file in an ancestor of a relative dir', async () => {
    await expect(findUp({ dir: relativeDir, fileNames: ['package.json'] })).resolves.toBe(
      path.resolve(import.meta.dirname, '../../package.json'),
    )
  })
})
