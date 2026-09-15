import { describe, expect, it } from 'vitest'

import type { Bump, ReportedFinding } from '../types'

import { buildPlan } from './plan'

const finding = (overrides: Partial<ReportedFinding> = {}): ReportedFinding => ({
  advisory: 'GHSA-aaaa-bbbb-cccc',
  bumps: [],
  chainPackages: [],
  fixed_in: '>=7.29.0',
  originPackages: [],
  package: 'undici',
  paths: [],
  severity: 'high',
  title: 'title',
  url: 'https://example.test',
  vulnerable: '<7.29.0',
  ...overrides,
})

const bump = (overrides: Partial<Bump>): Bump => ({
  currentSpec: null,
  dependency: 'dep',
  fix: { status: 'none' },
  workspacePackages: [],
  ...overrides,
})

describe('buildPlan', () => {
  it('emits a relock action keyed by the vulnerable module', () => {
    const plan = buildPlan({
      findings: [finding({ bumps: [bump({ fix: { status: 'relock', version: '1.7.0' } })] })],
      scope: 'monorepo',
    })

    expect(plan.actions).toEqual([
      { command: 'pnpm update undici', module: 'undici', type: 'relock' },
    ])
    expect(plan.verify).toBe('pnpm script:audit:deps:monorepo')
  })

  it('maps bump owners to manifest paths and dedupes across findings', () => {
    const fix = {
      crossesMajor: false,
      fromMajor: 7,
      status: 'fix',
      toMajor: 7,
      version: '7.29.0',
    } as const
    const plan = buildPlan({
      findings: [
        finding({
          bumps: [
            bump({ dependency: 'undici', fix, workspacePackages: ['ui', 'templates/website'] }),
          ],
        }),
        finding({
          advisory: 'GHSA-dddd-eeee-ffff',
          bumps: [bump({ dependency: 'undici', fix, workspacePackages: ['ui'] })],
        }),
      ],
      scope: 'consumer-facing',
    })

    expect(plan.actions).toEqual([
      {
        crossesMajor: false,
        dependency: 'undici',
        manifests: ['packages/ui/package.json', 'templates/website/package.json'],
        toRange: '>=7.29.0',
        type: 'bump',
      },
    ])
    expect(plan.verify).toBe('pnpm script:audit:deps:consumer')
  })

  it('records none and unknown fixes as manual actions with a reason', () => {
    const plan = buildPlan({
      findings: [
        finding({
          bumps: [
            bump({ dependency: 'left-pad', fix: { status: 'none' } }),
            bump({ dependency: 'right-pad', fix: { reason: 'registry', status: 'unknown' } }),
          ],
        }),
      ],
      scope: 'monorepo',
    })

    expect(plan.actions).toEqual([
      {
        advisory: 'GHSA-aaaa-bbbb-cccc',
        dependency: 'left-pad',
        module: 'undici',
        reason: 'no published version clears the vulnerability; allowlist or escalate',
        type: 'manual',
      },
      {
        advisory: 'GHSA-aaaa-bbbb-cccc',
        dependency: 'right-pad',
        module: 'undici',
        reason: 'registry unreachable; retry before deciding',
        type: 'manual',
      },
    ])
  })

  it('orders actions relock, then bump, then manual', () => {
    const plan = buildPlan({
      findings: [
        finding({
          bumps: [
            bump({ dependency: 'a', fix: { status: 'none' } }),
            bump({
              dependency: 'b',
              fix: {
                crossesMajor: false,
                fromMajor: 1,
                status: 'fix',
                toMajor: 1,
                version: '1.2.0',
              },
              workspacePackages: ['ui'],
            }),
            bump({ dependency: 'c', fix: { status: 'relock', version: '1.0.0' } }),
          ],
        }),
      ],
      scope: 'monorepo',
    })

    expect(plan.actions.map((action) => action.type)).toEqual(['relock', 'bump', 'manual'])
  })
})
