import { describe, expect, it, vi } from 'vitest'

import { getProvenanceCommit } from './getProvenanceCommit.js'

const sleep = async (): Promise<void> => {}

const slsaPredicateType = 'https://slsa.dev/provenance/v1'

const attestation = ({ payload, predicateType }: { payload: unknown; predicateType: string }) => ({
  bundle: {
    dsseEnvelope: { payload: Buffer.from(JSON.stringify(payload)).toString('base64') },
  },
  predicateType,
})

const slsaPayload = (gitCommit?: string) => ({
  predicate: {
    buildDefinition: { resolvedDependencies: [{ digest: gitCommit ? { gitCommit } : {} }] },
  },
})

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status })

const args = { name: '@payloadcms/ui', sleep, version: '4.0.0-canary.20261112' }

describe('getProvenanceCommit', () => {
  it('should return the gitCommit from the SLSA attestation, not the first attestation', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        attestations: [
          attestation({
            payload: { predicate: { name: '@payloadcms/ui' } },
            predicateType: 'https://github.com/npm/attestation/tree/main/specs/publish/v0.1',
          }),
          attestation({ payload: slsaPayload('abc123'), predicateType: slsaPredicateType }),
        ],
      }),
    )

    expect(await getProvenanceCommit({ ...args, fetchImpl })).toBe('abc123')
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://registry.npmjs.org/-/npm/v1/attestations/@payloadcms/ui@4.0.0-canary.20261112',
      expect.anything(),
    )
  })

  it('should return undefined on 404', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: 'Not found' }, 404))

    expect(await getProvenanceCommit({ ...args, fetchImpl })).toBeUndefined()
  })

  it('should return undefined when no SLSA attestation exists', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        attestations: [attestation({ payload: {}, predicateType: 'https://example.com/other' })],
      }),
    )

    expect(await getProvenanceCommit({ ...args, fetchImpl })).toBeUndefined()
  })

  it('should return undefined when gitCommit is missing', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        attestations: [attestation({ payload: slsaPayload(), predicateType: slsaPredicateType })],
      }),
    )

    expect(await getProvenanceCommit({ ...args, fetchImpl })).toBeUndefined()
  })

  it('should throw on a non-404 error status after retries', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 500))

    await expect(getProvenanceCommit({ ...args, fetchImpl })).rejects.toThrow(/500/)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('should throw when the SLSA payload is not valid JSON', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        attestations: [
          {
            bundle: { dsseEnvelope: { payload: Buffer.from('not json').toString('base64') } },
            predicateType: slsaPredicateType,
          },
        ],
      }),
    )

    await expect(getProvenanceCommit({ ...args, fetchImpl })).rejects.toThrow()
  })
})
