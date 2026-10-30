import { describe, expect, it } from 'vitest'

import {
  buildBumps,
  buildUnits,
  classifyFixes,
  findUnclearedBumps,
  listNoFix,
  slugDependency,
} from './bumps.mjs'

function entry({ dependency, currentSpec, version, crossesMajor, toMajor, status = 'fix' }) {
  const fix =
    status === 'fix'
      ? { crossesMajor, fromMajor: toMajor - (crossesMajor ? 1 : 0), status, toMajor, version }
      : { status }

  return { currentSpec, dependency, fix, workspacePackages: ['pkg'] }
}

function finding({ advisory, bumps, severity = 'moderate', paths = [], pkg = 'x' }) {
  return {
    advisory,
    bumps,
    chainPackages: [],
    originPackages: ['plugin-a', 'plugin-b'],
    package: pkg,
    paths,
    severity,
  }
}

function buildReport() {
  const storage = entry({
    dependency: '@google-cloud/storage',
    currentSpec: '7.19.0',
    version: '8.3.0',
    crossesMajor: true,
    toMajor: 8,
  })
  const sentry = (version) =>
    entry({
      dependency: '@sentry/nextjs',
      currentSpec: '^9.5.0',
      version,
      crossesMajor: true,
      toMajor: 10,
    })

  return {
    findings: [
      finding({
        advisory: 'GHSA-graphql',
        bumps: [
          entry({
            dependency: 'graphql-scalars',
            currentSpec: '1.22.2',
            version: '2.0.1',
            crossesMajor: true,
            toMajor: 2,
          }),
        ],
      }),
      finding({ advisory: 'GHSA-sentry-b', bumps: [sentry('10.54.0')] }),
      finding({ advisory: 'GHSA-sentry-a', bumps: [sentry('10.40.0')] }),
      finding({
        advisory: 'GHSA-csv',
        bumps: [
          entry({
            dependency: 'csv-parse',
            currentSpec: '5.6.0',
            version: '7.0.2',
            crossesMajor: true,
            toMajor: 7,
          }),
        ],
      }),
      finding({ advisory: 'GHSA-uuid', bumps: [storage, sentry('10.40.0')] }),
      finding({
        advisory: 'GHSA-esbuild',
        bumps: [
          {
            currentSpec: '0.31.7',
            dependency: 'drizzle-kit',
            fix: { status: 'none' },
            workspacePackages: ['db-sqlite'],
          },
        ],
        paths: ['drizzle-kit > @esbuild-kit/esm-loader > @esbuild-kit/core-utils'],
        pkg: 'esbuild',
      }),
    ],
    plan: {
      actions: [
        {
          type: 'bump',
          dependency: '@google-cloud/storage',
          manifests: ['packages/storage-gcs/package.json'],
        },
        {
          type: 'bump',
          dependency: '@sentry/nextjs',
          manifests: ['packages/plugin-sentry/package.json'],
        },
        {
          type: 'bump',
          dependency: '@sentry/nextjs',
          manifests: ['packages/plugin-sentry/package.json'],
        },
        {
          type: 'bump',
          dependency: 'csv-parse',
          manifests: ['packages/plugin-import-export/package.json'],
        },
        {
          type: 'bump',
          dependency: 'graphql-scalars',
          manifests: ['packages/graphql/package.json'],
        },
        { type: 'manual', dependency: 'drizzle-kit' },
      ],
      scope: 'consumer-facing',
    },
  }
}

describe('slugDependency', () => {
  it('should flatten scopes and punctuation', () => {
    expect(slugDependency({ dependency: '@sentry/nextjs' })).toBe('sentry-nextjs')
    expect(slugDependency({ dependency: 'csv-parse' })).toBe('csv-parse')
    expect(slugDependency({ dependency: '@a/b.c_d' })).toBe('a-b-c-d')
  })
})

describe('buildBumps', () => {
  it('should merge findings for one dependency into the highest target', () => {
    const bumps = buildBumps({ report: buildReport(), scope: 'consumer-facing' })
    const sentry = bumps.filter((bump) => bump.dependency === '@sentry/nextjs')

    expect(sentry).toEqual([
      {
        id: 'sentry-nextjs-10',
        advisories: ['GHSA-sentry-a', 'GHSA-sentry-b', 'GHSA-uuid'],
        dependency: '@sentry/nextjs',
        fallbackFor: null,
        from: '^9.5.0',
        fromVersion: '9.5.0',
        isMajor: true,
        manifests: ['packages/plugin-sentry/package.json'],
        to: '10.54.0',
      },
    ])
  })

  it('should add a fallback for a dependency with a major and a non-major target', () => {
    const report = {
      findings: [
        finding({
          advisory: 'GHSA-1',
          bumps: [
            entry({
              dependency: 'bar',
              currentSpec: '~3.0.0',
              version: '4.0.0',
              crossesMajor: true,
              toMajor: 4,
            }),
          ],
        }),
        finding({
          advisory: 'GHSA-2',
          bumps: [
            entry({
              dependency: 'bar',
              currentSpec: '~3.0.0',
              version: '3.4.1',
              crossesMajor: false,
              toMajor: 3,
            }),
          ],
        }),
      ],
      plan: { actions: [{ type: 'bump', dependency: 'bar', manifests: ['a/package.json'] }] },
    }

    const bumps = buildBumps({ report, scope: 'consumer-facing' })

    expect(bumps.map((bump) => bump.id)).toEqual(['bar-3-fallback', 'bar-4'])
    expect(bumps[0]).toMatchObject({
      advisories: ['GHSA-2'],
      fallbackFor: 'bar-4',
      fromVersion: '3.0.0',
      isMajor: false,
      to: '3.4.1',
    })
    expect(bumps[1]).toMatchObject({ fallbackFor: null, isMajor: true, to: '4.0.0' })
  })

  it('should not produce bumps for none or relock findings', () => {
    const relock = entry({ dependency: 'r', currentSpec: '1.0.0', status: 'relock' })
    const report = {
      findings: [finding({ advisory: 'GHSA-r', bumps: [relock] })],
      plan: { actions: [] },
    }

    expect(buildBumps({ report, scope: 'consumer-facing' })).toEqual([])
    expect(buildBumps({ report, scope: 'monorepo' })).toEqual([])
    expect(
      buildBumps({ report: buildReport(), scope: 'consumer-facing' }).some(
        (bump) => bump.dependency === 'drizzle-kit',
      ),
    ).toBe(false)
  })

  it('should list a shared advisory on every bump that reaches it', () => {
    const bumps = buildBumps({ report: buildReport(), scope: 'consumer-facing' })
    const withUuid = bumps.filter((bump) => bump.advisories.includes('GHSA-uuid'))

    expect(withUuid.map((bump) => bump.dependency).sort()).toEqual([
      '@google-cloud/storage',
      '@sentry/nextjs',
    ])
  })
})

describe('buildUnits', () => {
  it('should put non-major bumps in a group unit first, then majors by name', () => {
    const report = buildReport()
    report.findings.push(
      finding({
        advisory: 'GHSA-small',
        bumps: [
          entry({
            dependency: 'small',
            currentSpec: '1.0.0',
            version: '1.2.0',
            crossesMajor: false,
            toMajor: 1,
          }),
        ],
      }),
    )
    const bumps = buildBumps({ report, scope: 'consumer-facing' })
    const units = buildUnits({ bumps, ref: 'main' })

    expect(units[0]).toEqual({
      id: 'non-major',
      kind: 'group',
      branch: 'ci/audit-deps-fix-main-non-major',
      bumpIds: ['small-1'],
    })
    expect(units.slice(1).map((unit) => unit.id)).toEqual([
      'google-cloud-storage-8',
      'sentry-nextjs-10',
      'csv-parse-7',
      'graphql-scalars-2',
    ])
    expect(units[3]).toEqual({
      id: 'csv-parse-7',
      kind: 'major',
      branch: 'ci/audit-deps-fix-main-csv-parse-7',
      bumpIds: ['csv-parse-7'],
    })
  })

  it('should omit the group unit when there are no non-major bumps', () => {
    const bumps = buildBumps({ report: buildReport(), scope: 'consumer-facing' })

    expect(buildUnits({ bumps, ref: 'main' }).every((unit) => unit.kind === 'major')).toBe(true)
  })
})

describe('listNoFix', () => {
  it('should report findings that no release fixes', () => {
    expect(listNoFix({ report: buildReport(), scope: 'consumer-facing' })).toEqual([
      {
        advisory: 'GHSA-esbuild',
        affects: ['plugin-a', 'plugin-b'],
        module: 'esbuild',
        reason: 'No drizzle-kit release fixes it.',
        severity: 'moderate',
        through: ['drizzle-kit', '@esbuild-kit/esm-loader', '@esbuild-kit/core-utils'],
      },
    ])
  })

  it('should explain relock-only findings', () => {
    const report = {
      findings: [
        finding({
          advisory: 'GHSA-r',
          bumps: [entry({ dependency: 'r', currentSpec: '1.0.0', status: 'relock' })],
          pkg: 'r',
        }),
      ],
      plan: { actions: [] },
    }

    expect(listNoFix({ report, scope: 'consumer-facing' })[0].reason).toBe(
      'Needs an override or relock; consumers do not get our overrides.',
    )
    expect(listNoFix({ report, scope: 'monorepo' })[0].reason).toBe(
      'Not handled: needs a relock or override.',
    )
  })
})

describe('findUnclearedBumps', () => {
  const bumps = buildBumps({ report: buildReport(), scope: 'consumer-facing' })
  const storage = bumps.filter((bump) => bump.dependency === '@google-cloud/storage')
  const sentry = bumps.filter((bump) => bump.dependency === '@sentry/nextjs')

  function reaudit({ uuidDependencies }) {
    return {
      findings: [
        finding({
          advisory: 'GHSA-uuid',
          bumps: uuidDependencies.map((dependency) =>
            entry({
              dependency,
              currentSpec: '1.0.0',
              version: '9.9.9',
              crossesMajor: true,
              toMajor: 9,
            }),
          ),
        }),
      ],
      plan: { actions: [] },
    }
  }

  it('should allow a bump whose advisory remains only through another dependency', () => {
    const report = reaudit({ uuidDependencies: ['@sentry/nextjs'] })

    expect(findUnclearedBumps({ bumps: storage, report })).toEqual([])
  })

  it('should return a bump whose advisory is still reported through its own dependency', () => {
    const report = reaudit({ uuidDependencies: ['@sentry/nextjs'] })

    expect(findUnclearedBumps({ bumps: [...storage, ...sentry], report })).toEqual([
      'sentry-nextjs-10',
    ])
  })
})

describe('classifyFixes', () => {
  const bumps = buildBumps({ report: buildReport(), scope: 'consumer-facing' })

  it('should mark advisories absent from the re-audit as fixed', () => {
    const graphql = bumps.filter((bump) => bump.dependency === 'graphql-scalars')
    const report = { findings: [], plan: { actions: [] } }

    expect(classifyFixes({ bumps: graphql, report })).toEqual({
      fixed: ['GHSA-graphql'],
      partly: [],
    })
  })

  it('should mark an advisory still reported through other dependencies as partly fixed', () => {
    const storage = bumps.filter((bump) => bump.dependency === '@google-cloud/storage')
    const report = {
      findings: [
        finding({
          advisory: 'GHSA-uuid',
          bumps: [
            entry({
              dependency: '@sentry/nextjs',
              currentSpec: '^9.5.0',
              version: '10.40.0',
              crossesMajor: true,
              toMajor: 10,
            }),
          ],
        }),
      ],
      plan: { actions: [] },
    }

    expect(classifyFixes({ bumps: storage, report })).toEqual({ fixed: [], partly: ['GHSA-uuid'] })
  })
})

describe('buildBumps per-dependency collapse', () => {
  function barFinding({ advisory, version, currentSpec = '~3.0.0' }) {
    const toMajor = Number.parseInt(version, 10)
    const crossesMajor = toMajor > Number.parseInt(currentSpec.replace(/^[\^~=]+/, ''), 10)

    return finding({
      advisory,
      bumps: [entry({ dependency: 'bar', currentSpec, version, crossesMajor, toMajor })],
    })
  }

  function reportFor({ findings }) {
    return {
      findings,
      plan: { actions: [{ type: 'bump', dependency: 'bar', manifests: ['a/package.json'] }] },
    }
  }

  it('should subsume lower majors into one bump', () => {
    const report = reportFor({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '4.0.0' }),
        barFinding({ advisory: 'GHSA-2', version: '5.0.0' }),
      ],
    })

    const bumps = buildBumps({ report, scope: 'consumer-facing' })

    expect(bumps.map((bump) => bump.id)).toEqual(['bar-5'])
    expect(bumps[0].advisories).toEqual(['GHSA-1', 'GHSA-2'])
  })

  it('should give mixed current majors one bump and no fallback', () => {
    const report = reportFor({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '4.0.0', currentSpec: '^3.0.0' }),
        barFinding({ advisory: 'GHSA-1', version: '4.0.0', currentSpec: '^4.0.0' }),
      ],
    })

    const bumps = buildBumps({ report, scope: 'consumer-facing' })

    expect(bumps.map((bump) => bump.id)).toEqual(['bar-4'])
    expect(bumps[0]).toMatchObject({ fromVersion: '3.0.0', isMajor: true })
  })

  it('should list every advisory on the main bump and only lower ones on the fallback', () => {
    const report = reportFor({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '3.4.1' }),
        barFinding({ advisory: 'GHSA-2', version: '4.0.0' }),
      ],
    })

    const bumps = buildBumps({ report, scope: 'consumer-facing' })

    expect(bumps.find((bump) => bump.id === 'bar-4').advisories).toEqual(['GHSA-1', 'GHSA-2'])
    expect(bumps.find((bump) => bump.id === 'bar-3-fallback').advisories).toEqual(['GHSA-1'])
  })

  it('should put fallback bumps in the group unit', () => {
    const report = reportFor({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '3.4.1' }),
        barFinding({ advisory: 'GHSA-2', version: '4.0.0' }),
      ],
    })
    const bumps = buildBumps({ report, scope: 'consumer-facing' })
    const units = buildUnits({ bumps, ref: 'main' })

    expect(units.map((unit) => [unit.id, unit.bumpIds])).toEqual([
      ['non-major', ['bar-3-fallback']],
      ['bar-4', ['bar-4']],
    ])
  })

  it('should treat a minor change under 0.x as major', () => {
    const report = reportFor({
      findings: [barFinding({ advisory: 'GHSA-1', version: '0.6.0', currentSpec: '^0.5.1' })],
    })

    expect(buildBumps({ report, scope: 'consumer-facing' })).toEqual([
      expect.objectContaining({ id: 'bar-0', isMajor: true, to: '0.6.0' }),
    ])
  })

  it('should treat a patch change under 0.x as non-major', () => {
    const report = reportFor({
      findings: [barFinding({ advisory: 'GHSA-1', version: '0.5.3', currentSpec: '^0.5.1' })],
    })

    expect(buildBumps({ report, scope: 'consumer-facing' })).toEqual([
      expect.objectContaining({ id: 'bar-0', isMajor: false, to: '0.5.3' }),
    ])
  })

  it('should give a 0.x major a fallback only within the current minor', () => {
    const report = reportFor({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '0.5.3', currentSpec: '^0.5.1' }),
        barFinding({ advisory: 'GHSA-2', version: '0.6.0', currentSpec: '^0.5.1' }),
      ],
    })

    const bumps = buildBumps({ report, scope: 'consumer-facing' })

    expect(bumps.map((bump) => [bump.id, bump.to, bump.isMajor])).toEqual([
      ['bar-0', '0.6.0', true],
      ['bar-0-fallback', '0.5.3', false],
    ])
  })

  it('should throw when two dependencies get the same bump id', () => {
    const report = {
      findings: [
        finding({
          advisory: 'GHSA-1',
          bumps: [
            entry({
              dependency: '@foo/bar',
              currentSpec: '1.0.0',
              version: '1.0.1',
              crossesMajor: false,
              toMajor: 1,
            }),
            entry({
              dependency: 'foo-bar',
              currentSpec: '1.0.0',
              version: '1.0.2',
              crossesMajor: false,
              toMajor: 1,
            }),
          ],
        }),
      ],
      plan: { actions: [] },
    }

    expect(() => buildBumps({ report, scope: 'consumer-facing' })).toThrow(
      'bump id foo-bar-1 is shared by @foo/bar and foo-bar',
    )
  })

  it('should leave fromVersion empty for catalog and compound specs', () => {
    for (const currentSpec of ['catalog:', '^1.0.0 || ^2.0.0']) {
      const report = reportFor({
        findings: [
          finding({
            advisory: 'GHSA-1',
            bumps: [
              entry({
                dependency: 'bar',
                currentSpec,
                version: '1.2.0',
                crossesMajor: false,
                toMajor: 1,
              }),
            ],
          }),
        ],
      })

      expect(buildBumps({ report, scope: 'consumer-facing' })[0].fromVersion).toBe('')
    }
  })
})

describe('classifyFixes uncleared', () => {
  it('should leave an advisory in neither list when its own dependency still reports it', () => {
    const bumps = buildBumps({ report: buildReport(), scope: 'consumer-facing' }).filter(
      (bump) => bump.dependency === 'csv-parse',
    )
    const report = {
      findings: [
        finding({
          advisory: 'GHSA-csv',
          bumps: [
            entry({
              dependency: 'csv-parse',
              currentSpec: '5.6.0',
              version: '7.0.2',
              crossesMajor: true,
              toMajor: 7,
            }),
          ],
        }),
      ],
      plan: { actions: [] },
    }

    expect(classifyFixes({ bumps, report })).toEqual({ fixed: [], partly: [] })
  })
})
