import { describe, expect, it } from 'vitest'

import { parseArgs } from './cli'

describe('parseArgs', () => {
  it('defaults to consumer-facing / high / audit_output.json', () => {
    const result = parseArgs({ argv: [], env: {} })

    expect(result).toEqual({
      ok: true,
      options: { jsonPath: 'audit_output.json', scope: 'consumer-facing', severity: 'high' },
    })
  })

  it('treats empty INPUT_* values as unset (scheduled runs)', () => {
    const result = parseArgs({
      argv: [],
      env: { INPUT_JSON: '', INPUT_SCOPE: '', INPUT_SEVERITY: '' },
    })

    expect(result).toEqual({
      ok: true,
      options: { jsonPath: 'audit_output.json', scope: 'consumer-facing', severity: 'high' },
    })
  })

  it('reads options from INPUT_* env vars', () => {
    const result = parseArgs({
      argv: [],
      env: { INPUT_JSON: 'out.json', INPUT_SCOPE: 'monorepo', INPUT_SEVERITY: 'critical' },
    })

    expect(result).toEqual({
      ok: true,
      options: { jsonPath: 'out.json', scope: 'monorepo', severity: 'critical' },
    })
  })

  it('prefers CLI flags over env vars', () => {
    const result = parseArgs({
      argv: ['--scope=monorepo', '--severity=moderate'],
      env: { INPUT_SCOPE: 'consumer-facing', INPUT_SEVERITY: 'high' },
    })

    expect(result.ok).toBe(true)
    expect(result.ok && result.options.scope).toBe('monorepo')
    expect(result.ok && result.options.severity).toBe('moderate')
  })

  it('rejects an invalid scope', () => {
    const result = parseArgs({ argv: ['--scope=everything'], env: {} })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toContain("invalid scope 'everything'")
  })

  it('rejects an invalid severity', () => {
    const result = parseArgs({ argv: ['--severity=urgent'], env: {} })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toContain("invalid severity 'urgent'")
  })
})
