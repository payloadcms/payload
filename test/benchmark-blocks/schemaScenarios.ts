import type {
  Block,
  BlockSlug,
  CollectionConfig,
  Config,
  Field,
  GlobalConfig,
  SanitizedConfig,
} from 'payload'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

export const benchmarkScenarioNames = [
  'minimal',
  'wide-references',
  'nested-diamond',
  'nested-diamond-drafts',
  'nested-diamond-localized',
  'multiple-entities',
  'inline-control',
] as const

export type BenchmarkScenarioName = (typeof benchmarkScenarioNames)[number]

export const createBenchmarkConfig = async ({
  scenario,
}: {
  scenario: BenchmarkScenarioName
}): Promise<SanitizedConfig> => buildConfig(createConfig({ scenario }))

export const isBenchmarkScenarioName = (value: string): value is BenchmarkScenarioName =>
  benchmarkScenarioNames.includes(value as BenchmarkScenarioName)

const createConfig = ({ scenario }: { scenario: BenchmarkScenarioName }): Config => {
  const baseConfig: Config = {
    collections: [],
    db: mongooseAdapter({ url: false }),
    editor: lexicalEditor({}),
    logger: {
      options: {
        level: 'error',
      },
    },
    secret: 'mongodb-schema-build-benchmark',
    telemetry: false,
    typescript: {
      autoGenerate: false,
    },
  }

  if (scenario === 'minimal') {
    return {
      ...baseConfig,
      collections: [createCollection({ slug: 'pages', fields: [{ name: 'title', type: 'text' }] })],
    }
  }

  if (scenario === 'wide-references') {
    const blocks = createLeafBlocks({ count: 40, prefix: 'wide' })

    return {
      ...baseConfig,
      blocks,
      collections: [
        createCollection({
          slug: 'pages',
          fields: createReferencedBlockFields({
            blockSlugs: blocks.map(({ slug }) => slug as BlockSlug),
            count: 600,
            prefix: 'wide',
          }),
        }),
      ],
    }
  }

  if (scenario === 'inline-control') {
    return {
      ...baseConfig,
      collections: [
        createCollection({
          slug: 'pages',
          fields: Array.from(
            { length: 100 },
            (_, fieldIndex): Field => ({
              name: `inline_${fieldIndex}`,
              type: 'blocks',
              blocks: createLeafBlocks({ count: 20, prefix: 'inline' }),
            }),
          ),
        }),
      ],
    }
  }

  const isLocalized = scenario === 'nested-diamond-localized'
  const { blocks, rootSlugs } = createDiamondBlocks({ isLocalized })
  const fields = createReferencedBlockFields({
    blockSlugs: rootSlugs,
    count: scenario === 'multiple-entities' ? 1 : 20,
    isHalfLocalized: isLocalized,
    prefix: 'diamond',
  })

  if (scenario === 'multiple-entities') {
    return {
      ...baseConfig,
      blocks,
      collections: Array.from({ length: 4 }, (_, index) =>
        createCollection({ slug: `pages-${index}`, fields, isVersioned: true }),
      ),
      globals: Array.from(
        { length: 2 },
        (_, index): GlobalConfig => ({
          slug: `settings-${index}`,
          fields,
          versions: {
            drafts: true,
          },
        }),
      ),
    }
  }

  return {
    ...baseConfig,
    blocks,
    collections: [
      createCollection({
        slug: 'pages',
        fields,
        isVersioned:
          scenario === 'nested-diamond-drafts' || scenario === 'nested-diamond-localized',
      }),
    ],
    ...(isLocalized
      ? {
          localization: {
            defaultLocale: 'en',
            locales: ['en', 'de'],
          },
        }
      : {}),
  }
}

const createCollection = ({
  slug,
  fields,
  isVersioned = false,
}: {
  fields: Field[]
  isVersioned?: boolean
  slug: string
}): CollectionConfig => ({
  slug,
  fields,
  ...(isVersioned
    ? {
        versions: {
          drafts: true,
        },
      }
    : {}),
})

const createDiamondBlocks = ({
  isLocalized,
}: {
  isLocalized: boolean
}): {
  blocks: Block[]
  rootSlugs: BlockSlug[]
} => {
  const blocks: Block[] = []
  let childSlugs: BlockSlug[] = []

  for (let layer = 5; layer >= 0; layer--) {
    const layerSlugs = Array.from(
      { length: 4 },
      (_, blockIndex) => `diamond-${layer}-${blockIndex}` as BlockSlug,
    )

    for (const [blockIndex, slug] of layerSlugs.entries()) {
      blocks.push({
        slug,
        fields:
          layer === 5
            ? [
                {
                  name: `leaf_text_${blockIndex}`,
                  type: 'text',
                  ...(isLocalized ? { localized: true } : {}),
                },
              ]
            : [
                {
                  name: `children_${layer}_${blockIndex}`,
                  type: 'blocks',
                  blocks: childSlugs,
                },
              ],
      })
    }

    childSlugs = layerSlugs
  }

  return { blocks, rootSlugs: childSlugs }
}

const createLeafBlocks = ({ count, prefix }: { count: number; prefix: string }): Block[] =>
  Array.from({ length: count }, (_, index) => ({
    slug: `${prefix}-block-${index}`,
    fields: [
      { name: 'field1', type: 'text' },
      { name: 'field2', type: 'text' },
      { name: 'field3', type: 'text' },
      { name: 'field4', type: 'number' },
    ],
  }))

const createReferencedBlockFields = ({
  blockSlugs,
  count,
  isHalfLocalized = false,
  prefix,
}: {
  blockSlugs: BlockSlug[]
  count: number
  isHalfLocalized?: boolean
  prefix: string
}): Field[] =>
  Array.from({ length: count }, (_, index) => ({
    name: `${prefix}_${index}`,
    type: 'blocks',
    blocks: blockSlugs,
    ...(isHalfLocalized && index % 2 === 0 ? { localized: true } : {}),
  }))
