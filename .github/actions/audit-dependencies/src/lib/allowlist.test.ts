import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { loadAllowlist } from './allowlist'

const TODAY = new Date('2026-06-01T00:00:00Z')

const GHSA_A = 'GHSA-aaaa-bbbb-cccc'
const GHSA_B = 'GHSA-dddd-eeee-ffff'

let dir: string

const writeAllowlist = async (content: string): Promise<string> => {
  const path = join(dir, 'allowlist.json')
  await writeFile(path, content)
  return path
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'allowlist-test-'))
})

afterEach(async () => {
  await rm(dir, { force: true, recursive: true })
})

describe('loadAllowlist', () => {
  it('treats a missing file as an empty allowlist', async () => {
    const result = await loadAllowlist({
      path: join(dir, 'does-not-exist.json'),
      scope: 'consumer-facing',
      today: TODAY,
    })

    expect(result).toEqual({ allowlist: { activeGhsas: [], entries: [] }, ok: true })
  })

  it('returns a config error for malformed JSON (exit 2)', async () => {
    const path = await writeAllowlist('{ not json')

    const result = await loadAllowlist({ path, scope: 'monorepo', today: TODAY })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.kind).toBe('config')
  })

  it('returns a config error for an invalid entry (exit 2)', async () => {
    const path = await writeAllowlist(
      JSON.stringify({
        entries: [
          { advisory: 'not-a-ghsa', appliesTo: 'both', expires: '2027-01-01', rationale: 'x' },
        ],
      }),
    )

    const result = await loadAllowlist({ path, scope: 'monorepo', today: TODAY })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.kind).toBe('config')
  })

  it('fails when an entry is expired (exit 1)', async () => {
    const path = await writeAllowlist(
      JSON.stringify({
        entries: [
          {
            advisory: GHSA_A,
            appliesTo: 'both',
            expires: '2026-05-31',
            rationale: 'stale exception',
          },
        ],
      }),
    )

    const result = await loadAllowlist({ path, scope: 'consumer-facing', today: TODAY })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.kind).toBe('expired')
    expect(result.ok === false && result.error).toContain(GHSA_A)
  })

  it('treats an entry expiring today as still valid', async () => {
    const path = await writeAllowlist(
      JSON.stringify({
        entries: [
          { advisory: GHSA_A, appliesTo: 'both', expires: '2026-06-01', rationale: 'valid' },
        ],
      }),
    )

    const result = await loadAllowlist({ path, scope: 'consumer-facing', today: TODAY })

    expect(result.ok).toBe(true)
    expect(result.ok && result.allowlist.activeGhsas).toEqual([GHSA_A])
  })

  it('filters active GHSAs by scope', async () => {
    const path = await writeAllowlist(
      JSON.stringify({
        entries: [
          {
            advisory: GHSA_A,
            appliesTo: 'consumer',
            expires: '2027-01-01',
            rationale: 'consumer only',
          },
          {
            advisory: GHSA_B,
            appliesTo: 'monorepo',
            expires: '2027-01-01',
            rationale: 'monorepo only',
          },
        ],
      }),
    )

    const consumer = await loadAllowlist({ path, scope: 'consumer-facing', today: TODAY })
    const monorepo = await loadAllowlist({ path, scope: 'monorepo', today: TODAY })

    expect(consumer.ok && consumer.allowlist.activeGhsas).toEqual([GHSA_A])
    expect(monorepo.ok && monorepo.allowlist.activeGhsas).toEqual([GHSA_B])
  })
})
