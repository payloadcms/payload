import { describe, expect, it } from 'vitest'

import { buildBumps, buildPrs, classifyFixes, listNoFix } from './bumps.mjs'

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

function majorEntry({ dependency, currentSpec, version }) {
  return entry({
    dependency,
    currentSpec,
    version,
    crossesMajor: true,
    toMajor: Number.parseInt(version, 10),
  })
}

function buildReport() {
  const sentry = (version) =>
    majorEntry({ dependency: '@sentry/nextjs', currentSpec: '^9.5.0', version })
  const storage = majorEntry({
    dependency: '@google-cloud/storage',
    currentSpec: '7.19.0',
    version: '8.3.0',
  })

  return {
    findings: [
      finding({
        advisory: 'GHSA-graphql',
        bumps: [
          majorEntry({ dependency: 'graphql-scalars', currentSpec: '1.22.2', version: '2.0.1' }),
        ],
      }),
      finding({ advisory: 'GHSA-sentry-b', bumps: [sentry('10.54.0')] }),
      finding({ advisory: 'GHSA-sentry-a', bumps: [sentry('10.40.0')] }),
      finding({
        advisory: 'GHSA-csv',
        bumps: [majorEntry({ dependency: 'csv-parse', currentSpec: '5.6.0', version: '7.0.2' })],
      }),
      finding({ advisory: 'GHSA-uuid', bumps: [storage, sentry('10.40.0')] }),
      finding({
        advisory: 'GHSA-esbuild',
        bumps: [{ ...entry({ dependency: 'drizzle-kit', status: 'none' }), currentSpec: '0.31.7' }],
        paths: ['drizzle-kit > @esbuild-kit/esm-loader > @esbuild-kit/core-utils'],
        pkg: 'esbuild',
      }),
    ],
    plan: {
      actions: [
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
        { type: 'manual', dependency: 'drizzle-kit' },
      ],
      scope: 'consumer-facing',
    },
  }
}

function barFinding({ advisory, version, currentSpec = '~3.0.0' }) {
  const toMajor = Number.parseInt(version, 10)
  const crossesMajor = toMajor > Number.parseInt(currentSpec.replace(/^[\^~=]+/, ''), 10)

  return finding({
    advisory,
    bumps: [entry({ dependency: 'bar', currentSpec, version, crossesMajor, toMajor })],
  })
}

function buildBarBumps({ findings }) {
  return buildBumps({
    report: {
      findings,
      plan: { actions: [{ type: 'bump', dependency: 'bar', manifests: ['a/package.json'] }] },
    },
  })
}

describe('buildBumps', () => {
  it('should merge findings for one dependency into the highest target', () => {
    const bumps = buildBumps({ report: buildReport() })

    expect(bumps.filter((bump) => bump.dependency === '@sentry/nextjs')).toEqual([
      {
        id: 'sentry-nextjs-10',
        advisories: ['GHSA-sentry-a', 'GHSA-sentry-b', 'GHSA-uuid'],
        dependency: '@sentry/nextjs',
        from: '^9.5.0',
        fromVersion: '9.5.0',
        isMajor: true,
        manifests: ['packages/plugin-sentry/package.json'],
        to: '10.54.0',
      },
    ])
  })

  it('should not produce bumps for none or relock findings', () => {
    const relock = entry({ dependency: 'r', currentSpec: '1.0.0', status: 'relock' })
    const report = {
      findings: [finding({ advisory: 'GHSA-r', bumps: [relock] })],
      plan: { actions: [] },
    }

    expect(buildBumps({ report })).toEqual([])
    expect(buildBumps({ report: buildReport() }).map((bump) => bump.dependency)).not.toContain(
      'drizzle-kit',
    )
  })

  it('should subsume lower majors into one bump', () => {
    const bumps = buildBarBumps({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '4.0.0' }),
        barFinding({ advisory: 'GHSA-2', version: '5.0.0' }),
      ],
    })

    expect(bumps.map((bump) => [bump.id, bump.advisories])).toEqual([
      ['bar-5', ['GHSA-1', 'GHSA-2']],
    ])
  })

  it('should give mixed current majors one bump and no in-major fix', () => {
    const bumps = buildBarBumps({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '4.0.0', currentSpec: '^3.0.0' }),
        barFinding({ advisory: 'GHSA-1', version: '4.0.0', currentSpec: '^4.0.0' }),
      ],
    })

    expect(bumps.map((bump) => bump.id)).toEqual(['bar-4'])
    expect(bumps[0]).toMatchObject({ fromVersion: '3.0.0', isMajor: true })
  })

  it('should keep the major and add an in-major fix in the group PR when the fix clears only some advisories', () => {
    const bumps = buildBarBumps({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '3.4.1' }),
        barFinding({ advisory: 'GHSA-2', version: '4.0.0' }),
      ],
    })

    expect(bumps.map((bump) => [bump.id, bump.to, bump.isMajor, bump.advisories])).toEqual([
      ['bar-3-in-major', '3.4.1', false, ['GHSA-1']],
      ['bar-4', '4.0.0', true, ['GHSA-1', 'GHSA-2']],
    ])
    expect(buildPrs({ bumps, ref: 'main' }).map((pr) => [pr.id, pr.kind, pr.bumpIds])).toEqual([
      ['non-major', 'group', ['bar-3-in-major']],
      ['bar-4', 'major', ['bar-4']],
    ])
  })

  it('should keep the major when an advisory has one entry fixed in-major and one needing the major', () => {
    const bumps = buildBarBumps({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '3.4.1' }),
        barFinding({ advisory: 'GHSA-1', version: '4.0.0' }),
        barFinding({ advisory: 'GHSA-2', version: '3.4.1' }),
      ],
    })

    expect(bumps.map((bump) => [bump.id, bump.to, bump.isMajor, bump.advisories])).toEqual([
      ['bar-3-in-major', '3.4.1', false, ['GHSA-2']],
      ['bar-4', '4.0.0', true, ['GHSA-1', 'GHSA-2']],
    ])
  })

  it('should give only the major when the in-major fix clears no advisory fully', () => {
    const bumps = buildBarBumps({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '3.4.1' }),
        barFinding({ advisory: 'GHSA-1', version: '4.0.0' }),
      ],
    })

    expect(bumps.map((bump) => [bump.id, bump.advisories])).toEqual([['bar-4', ['GHSA-1']]])
  })

  it.each([
    ['a minor change as major', '0.6.0', true],
    ['a patch change as non-major', '0.5.3', false],
  ])('should treat %s under 0.x', (_name, version, isMajor) => {
    const bumps = buildBarBumps({
      findings: [barFinding({ advisory: 'GHSA-1', version, currentSpec: '^0.5.1' })],
    })

    expect(bumps.map((bump) => [bump.id, bump.to, bump.isMajor])).toEqual([
      ['bar-0', version, isMajor],
    ])
  })

  it('should give a 0.x major an in-major fix only within the current minor', () => {
    const bumps = buildBarBumps({
      findings: [
        barFinding({ advisory: 'GHSA-1', version: '0.5.3', currentSpec: '^0.5.1' }),
        barFinding({ advisory: 'GHSA-2', version: '0.6.0', currentSpec: '^0.5.1' }),
      ],
    })

    expect(bumps.map((bump) => [bump.id, bump.to, bump.isMajor])).toEqual([
      ['bar-0', '0.6.0', true],
      ['bar-0-in-major', '0.5.3', false],
    ])
  })

  it.each([['latest'], ['1.0.0\n::error::x']])(
    'should throw on a fix version %j that is not strict semver',
    (version) => {
      const report = {
        findings: [
          finding({
            advisory: 'GHSA-1',
            bumps: [entry({ dependency: 'a', currentSpec: '1.0.0', version, toMajor: 1 })],
          }),
        ],
        plan: { actions: [] },
      }

      expect(() => buildBumps({ report })).toThrow(
        `invalid fix version for a: ${JSON.stringify(version)}`,
      )
    },
  )

  it('should throw when two dependencies get the same bump id', () => {
    const patch = (dependency) =>
      entry({ dependency, currentSpec: '1.0.0', version: '1.0.1', crossesMajor: false, toMajor: 1 })
    const report = {
      findings: [finding({ advisory: 'GHSA-1', bumps: [patch('@foo/bar'), patch('foo-bar')] })],
      plan: { actions: [] },
    }

    expect(() => buildBumps({ report })).toThrow('bump id foo-bar-1 is shared')
  })
})

describe('buildPrs', () => {
  it('should put non-major bumps in a group PR first, then majors by name', () => {
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

    const prs = buildPrs({ bumps: buildBumps({ report }), ref: 'main' })

    expect(prs[0]).toEqual({
      id: 'non-major',
      kind: 'group',
      branch: 'ci/audit-deps-fix-main-non-major',
      bumpIds: ['small-1'],
    })
    expect(prs.slice(1).map((pr) => pr.id)).toEqual([
      'google-cloud-storage-8',
      'sentry-nextjs-10',
      'csv-parse-7',
      'graphql-scalars-2',
    ])
    expect(prs[3]).toEqual({
      id: 'csv-parse-7',
      kind: 'major',
      branch: 'ci/audit-deps-fix-main-csv-parse-7',
      bumpIds: ['csv-parse-7'],
    })
  })

  it('should omit the group PR when there are no non-major bumps', () => {
    const bumps = buildBumps({ report: buildReport() })

    expect(buildPrs({ bumps, ref: 'main' }).every((pr) => pr.kind === 'major')).toBe(true)
  })
})

describe('listNoFix', () => {
  it('should report findings that no release fixes', () => {
    expect(listNoFix({ report: buildReport(), scope: 'consumer-facing' })).toEqual([
      {
        advisory: 'GHSA-esbuild',
        module: 'esbuild',
        reason: 'No drizzle-kit release fixes it.',
        severity: 'moderate',
      },
    ])
  })
})

describe('classifyFixes', () => {
  const bumps = buildBumps({ report: buildReport() })
  const bumpsFor = (dependency) => bumps.filter((bump) => bump.dependency === dependency)
  const reauditWith = ({ advisory, dependency }) => ({
    findings: [finding({ advisory, bumps: [entry({ dependency, status: 'none' })] })],
    plan: { actions: [] },
  })

  it('should mark an advisory still reported through other dependencies as partly fixed', () => {
    const report = reauditWith({ advisory: 'GHSA-uuid', dependency: '@sentry/nextjs' })

    expect(classifyFixes({ bumps: bumpsFor('@google-cloud/storage'), report })).toEqual({
      fixed: [],
      partly: ['GHSA-uuid'],
    })
  })

  it('should keep an advisory uncleared when any of its findings reaches a bumped dependency', () => {
    const report = {
      findings: [
        ...reauditWith({ advisory: 'GHSA-uuid', dependency: '@google-cloud/storage' }).findings,
        ...reauditWith({ advisory: 'GHSA-uuid', dependency: '@sentry/nextjs' }).findings,
      ],
      plan: { actions: [] },
    }

    expect(classifyFixes({ bumps: bumpsFor('@google-cloud/storage'), report })).toEqual({
      fixed: [],
      partly: [],
    })
  })
})
