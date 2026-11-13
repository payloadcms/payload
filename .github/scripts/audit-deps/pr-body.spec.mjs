import { describe, expect, it } from 'vitest'

import { isDraftPr, renderPrBody } from './pr-body.mjs'

const repoUrl = 'https://github.com/payloadcms/payload'
const runUrl = 'https://github.com/payloadcms/payload/actions/runs/1'
const now = new Date('2026-09-10T00:00:00Z')
const compareUrl = 'https://github.com/adaltas/node-csv/compare/csv-parse@5.6.0...csv-parse@7.0.2'
const MAJOR_BANNER =
  'Major version: no automated review. Read the release notes and check breaking changes before you merge.'
const ZERO_WIDTH_SPACE = '​'

const csvBump = {
  id: 'csv-parse-7',
  dependency: 'csv-parse',
  from: '5.6.0',
  fromVersion: '5.6.0',
  to: '7.0.2',
  isMajor: true,
  manifests: ['packages/plugin-import-export/package.json'],
  advisories: ['GHSA-8cw4-87c7-c6xx'],
}

const csvDetails = {
  notes: {
    entries: [
      {
        version: '7.0.0',
        url: 'https://github.com/adaltas/node-csv/blob/csv-parse@7.0.0/packages/csv-parse/CHANGELOG.md',
        text: '# 7.0.0\n\nWARNING: published by mistake.',
        isMajor: true,
      },
    ],
    links: {
      releases: null,
      changelog: 'https://github.com/adaltas/node-csv/blob/main/packages/csv-parse/CHANGELOG.md',
      compare: compareUrl,
    },
    source: 'changelog',
  },
  commits: {
    commits: [
      {
        sha: 'eb4d148aaaaaaaa',
        message: 'fix(csv-parse): prototype replacement\n\nbody',
        url: 'https://github.com/adaltas/node-csv/commit/eb4d148aaaaaaaa',
      },
    ],
    total: 12,
    compareUrl,
    repoMoved: false,
    releaseLinks: [],
  },
  advisories: [
    {
      ghsa: 'GHSA-8cw4-87c7-c6xx',
      summary: 'Prototype replacement still reachable via columns path',
      description: 'Impact text.',
      severity: 'moderate',
    },
  ],
  packageMeta: {
    repo: { owner: 'adaltas', name: 'node-csv', directory: 'packages/csv-parse' },
    publishedAt: '2026-06-13T00:00:00Z',
  },
  downloads: 3685407,
  affects: {
    direct: [{ name: '@payloadcms/plugin-import-export', dir: 'plugin-import-export' }],
    via: [],
  },
}

const noNotes = {
  ...csvDetails,
  notes: { entries: [], links: { releases: null, changelog: null, compare: null }, source: 'none' },
}

function render({
  pr = { id: 'csv-parse-7', kind: 'major', branch: 'b', bumpIds: [csvBump.id] },
  bumps = [csvBump],
  details = { [csvBump.id]: csvDetails },
  fixed = csvBump.advisories,
  partly = [],
} = {}) {
  return renderPrBody({
    pr,
    bumps,
    details,
    fixed,
    partly,
    scope: 'consumer-facing',
    severity: 'moderate',
    ref: 'main',
    repoUrl,
    runUrl,
    now,
  })
}

function renderCsv({ details }) {
  return render({ details: { [csvBump.id]: details } })
}

function renderGroup({ bumps, details }) {
  return render({
    pr: { id: 'non-major', kind: 'group', branch: 'b', bumpIds: bumps.map((bump) => bump.id) },
    bumps,
    details: Object.fromEntries(bumps.map((bump) => [bump.id, details])),
    fixed: [],
  })
}

function withNoteText({ text }) {
  return { ...csvDetails.notes, entries: [{ ...csvDetails.notes.entries[0], text }] }
}

describe('major review banner', () => {
  it('should start a major body with the review banner, naming missing notes only when absent', () => {
    const withNotes = renderCsv({ details: csvDetails }).split('\n')
    const withoutNotes = renderCsv({ details: noNotes }).split('\n')

    expect(withNotes[0]).toBe(MAJOR_BANNER)
    expect(withNotes.slice(0, 3).join('\n')).not.toContain('No release notes found for')
    expect(withoutNotes[0]).toBe(MAJOR_BANNER)
    expect(withoutNotes[1]).toBe('No release notes found for 7.x.')
  })

  it('should draft every major PR and no group PR', () => {
    expect(isDraftPr({ pr: { kind: 'major' } })).toBe(true)
    expect(isDraftPr({ pr: { kind: 'group' } })).toBe(false)
  })
})

describe('package heading', () => {
  it('should quote each advisory with its own link and severity under a name-only heading', () => {
    const second = {
      ghsa: 'GHSA-w5hq-cccc-ffff',
      summary: 'Second',
      description: '',
      severity: 'high',
    }
    const one = renderCsv({ details: csvDetails })
    const two = renderCsv({
      details: { ...csvDetails, advisories: [...csvDetails.advisories, second] },
    })
    const firstParagraph =
      '> Prototype replacement still reachable via columns path ([GHSA-8cw4-87c7-c6xx](https://github.com/advisories/GHSA-8cw4-87c7-c6xx) · moderate)'
    const secondParagraph =
      '> Second ([GHSA-w5hq-cccc-ffff](https://github.com/advisories/GHSA-w5hq-cccc-ffff) · high)'

    expect(one).toContain(`### csv-parse\n\n${firstParagraph}\n\n<details>`)
    expect(two).toContain(`### csv-parse\n\n${firstParagraph}\n>\n${secondParagraph}\n\n<details>`)
  })

  it('should quote only the link and severity when an advisory has no summary', () => {
    const body = renderCsv({
      details: { ...csvDetails, advisories: [{ ...csvDetails.advisories[0], summary: '' }] },
    })

    expect(body).toContain(
      '### csv-parse\n\n> [GHSA-8cw4-87c7-c6xx](https://github.com/advisories/GHSA-8cw4-87c7-c6xx) · moderate\n\n',
    )
  })

  it('should render no quote block when the package has no advisories', () => {
    const body = renderCsv({ details: { ...csvDetails, advisories: [] } })

    expect(body).toContain('### csv-parse\n\n<details>')
    expect(body).not.toMatch(/^>/m)
  })
})

describe('partly fixed advisories', () => {
  it('should render partly in the Fixes column and the lead line', () => {
    const partlyAdvisory = {
      ghsa: 'GHSA-w5hq-cccc-ffff',
      summary: 'other',
      description: '',
      severity: 'high',
    }

    const body = render({
      details: {
        [csvBump.id]: { ...csvDetails, advisories: [...csvDetails.advisories, partlyAdvisory] },
      },
      partly: [partlyAdvisory.ghsa],
    })

    expect(body).toContain('partly [w5hq](https://github.com/advisories/GHSA-w5hq-cccc-ffff)')
    expect(body).toContain(
      'This PR fixes 1 advisory (consumer-facing, moderate+). 1 more is partly fixed.',
    )
  })
})

describe('outside text', () => {
  it('should not let outside text break structure', () => {
    const evil = 'x --> <!-- hidden | col\n@someone'
    const body = renderCsv({
      details: {
        ...csvDetails,
        notes: withNoteText({ text: evil }),
        commits: {
          ...csvDetails.commits,
          commits: [
            { sha: 'abcdef1234', message: evil, url: 'https://github.com/a/b/commit/abcdef1234' },
          ],
        },
        advisories: [
          {
            ...csvDetails.advisories[0],
            summary: evil,
            description: evil,
            severity: 'mod|er\nate',
          },
        ],
        affects: { direct: [{ name: 'we|ird\nname', dir: 'weird' }], via: [] },
      },
    })
    const tableRows = body.split('\n').filter((line) => line.startsWith('|'))

    expect(body.match(/<!--/g)).toHaveLength(1)
    expect(body).not.toContain('@someone')
    expect(tableRows).toHaveLength(3)
    for (const row of tableRows) {
      expect(row.replaceAll('\\|', '').match(/\|/g).length).toBe(8)
    }
  })

  it('should neutralize issue references in notes, commits and advisories', () => {
    const text = 'fix #482 and org/repo#5 see https://github.com/a/b/issues/1'
    const body = renderCsv({
      details: {
        ...csvDetails,
        notes: withNoteText({ text }),
        commits: {
          ...csvDetails.commits,
          commits: [
            { sha: 'abcdef1234', message: text, url: 'https://github.com/a/b/commit/abcdef1234' },
          ],
        },
        advisories: [{ ...csvDetails.advisories[0], summary: text, description: text }],
      },
    })

    expect(body).not.toMatch(/#\d/)
    expect(body).not.toContain('see https://github.com/')
    expect(body.match(new RegExp(`#${ZERO_WIDTH_SPACE}482`, 'g'))).toHaveLength(4)
    expect(body).toContain('see https://redirect.github.com/a/b/issues/1')
  })

  it('should send outside GitHub links through redirect.github.com', () => {
    const body = renderCsv({
      details: {
        ...csvDetails,
        notes: {
          ...csvDetails.notes,
          entries: [{ ...csvDetails.notes.entries[0], url: 'https://github.com/a/b/issues/1' }],
        },
        packageMeta: {
          ...csvDetails.packageMeta,
          repo: { owner: 'adaltas', name: 'node-csv', directory: '../../a/b/issues/2' },
        },
      },
    })

    expect(body).not.toContain('https://github.com/adaltas/')
    expect(body).not.toContain('https://github.com/a/b/')
    expect(body).not.toContain('../')
    expect(body).toContain('(https://redirect.github.com/a/b/issues/1)')
    expect(body).toContain('(https://redirect.github.com/adaltas/node-csv/compare/')
    expect(body).toContain('([source](https://redirect.github.com/adaltas/node-csv))')
  })

  it('should close fences left open in release notes and in a cut description', () => {
    const body = renderCsv({
      details: {
        ...csvDetails,
        notes: withNoteText({ text: '~~~\nnote' }),
        advisories: [{ ...csvDetails.advisories[0], description: `\`\`\`\n${'x'.repeat(5000)}` }],
      },
    })

    expect(body).toContain('note\n~~~\n')
    expect(body).toContain('x…\n```\n')
  })

  it.each(['http://x.test/a', 'https://x.test/a|b', 'javascript:alert(1)', 'https://x.test/a)b'])(
    'should not link the unsafe url %s',
    (compare) => {
      const body = renderCsv({
        details: {
          ...csvDetails,
          notes: { ...csvDetails.notes, links: { ...csvDetails.notes.links, compare: null } },
          commits: { ...csvDetails.commits, compareUrl: compare },
        },
      })

      expect(body).not.toContain(`](${compare})`)
      expect(body).toContain('| `5.6.0` → `7.0.2` |')
    },
  )
})

describe('size cap', () => {
  const bumps = Array.from({ length: 40 }, (_, index) => ({
    ...csvBump,
    id: `dep-${index}`,
    dependency: `dep-${index}`,
    isMajor: false,
    advisories: [],
  }))
  const longNotes = { ...csvDetails, notes: withNoteText({ text: 'n'.repeat(8000) }) }
  const longAdvisories = {
    ...csvDetails,
    advisories: Array.from({ length: 10 }, (_, index) => ({
      ghsa: `GHSA-${index}`,
      summary: 's'.repeat(200),
      description: 'd'.repeat(4000),
      severity: 'high',
      url: '',
    })),
  }

  it.each([
    ['sections are dropped', longNotes, false],
    ['whole packages are cut', longAdvisories, true],
  ])(
    'should stay under the cap and keep the fingerprint last when %s',
    (_name, details, hasCutNote) => {
      const body = renderGroup({ bumps, details })

      expect(body.length).toBeLessThanOrEqual(60000)
      expect(body.match(/^\| \[dep-\d/gm)).toHaveLength(40)
      expect(body.includes("Some sections were cut to fit GitHub's size limit.")).toBe(hasCutNote)
      expect(body).toContain('Generated by audit-dependencies')
      expect(body.trimEnd().split('\n').at(-1)).toMatch(/^<!-- audit-deps: /)
    },
  )
})
