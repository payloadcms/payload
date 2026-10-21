import type { Field } from 'payload'

export type BranchQueryPerformanceScenario = {
  branches: number
  documents: number
  locales: number
  overrideDensity: number
}

export const performanceSlug = 'branch-performance-articles'
export const performanceLocales = ['en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'sv', 'ja', 'ko']

export const getPerformanceIterations = ({
  evidence,
  value = process.env.PAYLOAD_BRANCH_PERF_ITERATIONS,
}: {
  evidence: string
  value?: string
}): number => {
  const iterations = Number(value ?? 40)
  if (!Number.isSafeInteger(iterations) || iterations < (evidence === 'final' ? 40 : 1)) {
    throw new Error(
      'Performance iterations must be a positive integer, with at least 40 for final evidence.',
    )
  }
  return iterations
}

export const performanceFields: Field[] = [
  { name: 'id', type: 'text' },
  { name: 'ordinal', type: 'number', index: true },
  { name: 'category', type: 'number', index: true },
  { name: 'title', type: 'text', localized: true, index: true },
  { name: 'related', type: 'relationship', relationTo: performanceSlug, hasMany: true },
  {
    name: 'content',
    type: 'blocks',
    blocks: [
      {
        slug: 'section',
        fields: [
          { name: 'heading', type: 'text', localized: true },
          {
            name: 'items',
            type: 'array',
            fields: [
              { name: 'label', type: 'text', localized: true },
              {
                name: 'children',
                type: 'array',
                fields: [{ name: 'value', type: 'text', localized: true }],
              },
            ],
          },
        ],
      },
    ],
  },
]

export const getPerformanceScenario = (): BranchQueryPerformanceScenario => {
  const scenario = {
    branches: Number(process.env.PAYLOAD_BRANCH_PERF_BRANCHES ?? 1),
    documents: Number(process.env.PAYLOAD_BRANCH_PERF_DOCUMENTS ?? 10_000),
    locales: Number(process.env.PAYLOAD_BRANCH_PERF_LOCALES ?? 2),
    overrideDensity: Number(process.env.PAYLOAD_BRANCH_PERF_DENSITY ?? 0.01),
  }

  if (
    ![1, 20].includes(scenario.branches) ||
    ![2, 10].includes(scenario.locales) ||
    ![10_000, 100_000].includes(scenario.documents) ||
    ![0.01, 0.8].includes(scenario.overrideDensity)
  ) {
    throw new Error(
      'Performance scenarios require 10k/100k documents, 1/20 branches, 2/10 locales, and 0.01/0.8 override density.',
    )
  }

  return scenario
}

export const getPerformanceLogicalID = ({ ordinal }: { ordinal: number }): string =>
  `article-${String(ordinal).padStart(6, '0')}`

export const getPerformanceBranches = ({
  scenario,
}: {
  scenario: BranchQueryPerformanceScenario
}): string[] => Array.from({ length: scenario.branches }, (_, index) => `review-${index + 1}`)

export const hasPerformanceOverride = ({
  ordinal,
  scenario,
}: {
  ordinal: number
  scenario: BranchQueryPerformanceScenario
}): boolean => ordinal % 100 < scenario.overrideDensity * 100

/** One percent of records exercise three nested block/array levels and 32 relationship edges. */
export const buildPerformanceData = ({
  hasOverride = false,
  ordinal,
  scenario,
}: {
  hasOverride?: boolean
  ordinal: number
  scenario: BranchQueryPerformanceScenario
}): Record<string, unknown> => {
  const locales = performanceLocales.slice(0, scenario.locales)
  const isHeavy = ordinal % 100 === 0
  const localized = ({ suffix }: { suffix: string }): Record<string, string> =>
    Object.fromEntries(
      locales.map((locale) => [
        locale,
        `${locale}-${suffix}-${String(ordinal).padStart(6, '0')}${hasOverride ? '-review' : ''}`,
      ]),
    )

  return {
    id: getPerformanceLogicalID({ ordinal }),
    ordinal,
    category: ordinal % 100,
    title: localized({ suffix: 'title' }),
    related: Array.from({ length: isHeavy ? 32 : 1 }, (_, index) =>
      getPerformanceLogicalID({
        ordinal: (ordinal + index + (isHeavy ? 0 : 1)) % scenario.documents,
      }),
    ),
    content: isHeavy
      ? [
          {
            id: `section-${ordinal}`,
            blockType: 'section',
            heading: localized({ suffix: 'heading' }),
            items: Array.from({ length: 4 }, (_, index) => ({
              id: `item-${ordinal}-${index}`,
              label: localized({ suffix: `label-${index}` }),
              children: Array.from({ length: 3 }, (_, childIndex) => ({
                id: `child-${ordinal}-${index}-${childIndex}`,
                value: localized({ suffix: `value-${index}-${childIndex}` }),
              })),
            })),
          },
        ]
      : [],
    _status: Object.fromEntries(
      locales.map((locale) => [locale, hasOverride && locale === 'fr' ? 'draft' : 'published']),
    ),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

export const summarizePerformanceSamples = ({
  samples,
}: {
  samples: number[]
}): { p50: number; p95: number } => {
  if (!samples.length || samples.some((sample) => !Number.isFinite(sample) || sample < 0)) {
    throw new Error('Performance measurements must contain finite nonnegative samples.')
  }
  const sorted = [...samples].sort((left, right) => left - right)
  const percentile = ({ value }: { value: number }) =>
    sorted[Math.max(0, Math.ceil(sorted.length * value) - 1)]!

  return { p50: percentile({ value: 0.5 }), p95: percentile({ value: 0.95 }) }
}
