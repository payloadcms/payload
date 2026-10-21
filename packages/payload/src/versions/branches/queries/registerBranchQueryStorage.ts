import type { CollectionConfig } from '../../../collections/config/types.js'
import type { Config, SanitizedConfig } from '../../../config/types.js'
import type { RichTextSanitizer } from '../../../fields/config/sanitize.js'
import type { GlobalConfig } from '../../../globals/config/types.js'

import { sanitizeCollection } from '../../../collections/config/sanitize.js'
import { buildBranchProjectionCollections } from './buildBranchProjectionCollections.js'
import { buildBranchProjectionControlCollections } from './buildBranchProjectionControlCollections.js'

export type BranchQueryStorage = {
  invalidations: string
  projection: string
  states: string
}

/** Opt-in internal schemas. Actual projection fields are built after stored fields are expanded. */
export const registerBranchQueryStorage = ({
  collections,
  globals,
}: {
  collections: CollectionConfig[]
  globals: GlobalConfig[]
}): { collections: CollectionConfig[]; globals: GlobalConfig[] } => {
  const controls: CollectionConfig[] = []
  const register = <T extends CollectionConfig | GlobalConfig>({
    entity,
    isGlobal,
  }: {
    entity: T
    isGlobal: boolean
  }): T => {
    if (!entity.custom?.branchStorage) {
      return entity
    }

    const prefix = `${isGlobal ? 'global' : 'collection'}-${entity.slug}`
    const storage: BranchQueryStorage = {
      invalidations: `${prefix}-query-invalidations`,
      projection: `${prefix}-projection`,
      states: `${prefix}-query-states`,
    }

    controls.push(...buildBranchProjectionControlCollections(storage))

    return { ...entity, custom: { ...entity.custom, branchQueryStorage: storage } }
  }
  const nextCollections = collections.map((entity) => register({ entity, isGlobal: false }))
  const nextGlobals = globals.map((entity) => register({ entity, isGlobal: true }))
  const allSlugs = [...nextCollections, ...controls].map(({ slug }) => slug)

  if (new Set(allSlugs).size !== allSlugs.length) {
    throw new Error(
      'Internal branch query storage collection slugs collide with configured collections.',
    )
  }

  return { collections: [...nextCollections, ...controls], globals: nextGlobals }
}

/** Called once after collection/global sanitization so auth/upload/timestamps are complete. */
export const sanitizeBranchQueryStorage = ({
  config,
  richTextSanitizers,
}: {
  config: SanitizedConfig
  richTextSanitizers: RichTextSanitizer[]
}): SanitizedConfig => {
  const originals = config.collections.filter(({ custom }) => custom?.branchQueryStorage)
  const globals = config.globals.filter(({ custom }) => custom?.branchQueryStorage)

  if (!originals.length && !globals.length) {
    return config
  }

  assertBranchQuerySchemaOwnership({ adapter: config.db })

  const { collections: built, projectionSlugs } = buildBranchProjectionCollections({
    blocks: config.blocks,
    collections: originals,
    defaultIDType: config.db.defaultIDType,
  })
  const generated = built.slice(originals.length)

  for (const source of originals) {
    const storage = source.custom.branchQueryStorage as BranchQueryStorage

    if (projectionSlugs[source.slug] !== storage.projection) {
      throw new Error('Branch projection registration does not match its expanded schema.')
    }
  }

  for (const [index, global] of globals.entries()) {
    let sourceSlug = `payload-internal-global-query-source-${index}`

    while (config.collections.some(({ slug }) => slug === sourceSlug)) {
      sourceSlug += '-source'
    }

    const globalResult = buildBranchProjectionCollections({
      blocks: config.blocks,
      collections: [{ slug: sourceSlug, fields: global.fields, versions: { drafts: true } }],
      defaultIDType: 'text',
      namespace: `global:${global.slug}`,
      relatedProjectionSlugs: projectionSlugs,
    })
    const projection = globalResult.collections[1]!

    projection.slug = (global.custom.branchQueryStorage as BranchQueryStorage).projection
    projection.custom = { branchProjectionStorage: { global: global.slug } }
    const metadata = projection.fields.find(
      (field) => 'name' in field && field.name === '_branchProjection',
    )

    if (metadata?.type === 'group') {
      metadata.fields = metadata.fields.map((field) =>
        'name' in field && field.name === 'logicalID'
          ? { name: 'logicalID', type: 'text', required: true }
          : 'name' in field && field.name === 'nativeGlobalID'
            ? config.db.defaultIDType === 'number'
              ? { name: 'nativeGlobalID', type: 'number' }
              : { name: 'nativeGlobalID', type: 'text' }
            : field,
      )
    }

    generated.push(projection)
  }

  const allSlugs = [
    ...config.collections.map(({ slug }) => slug),
    ...generated.map(({ slug }) => slug),
  ]

  if (new Set(allSlugs).size !== allSlugs.length) {
    throw new Error(
      'Internal branch projection collection slugs collide with configured collections.',
    )
  }

  // Register every relation target before sanitizing joins, including self/cyclic relationships.
  config.collections.push(...(generated as typeof config.collections))

  for (
    let index = config.collections.length - generated.length;
    index < config.collections.length;
    index++
  ) {
    config.collections[index] = sanitizeCollection(
      config as unknown as Config,
      config.collections[index]!,
      richTextSanitizers,
      allSlugs,
    )
  }

  return config
}

/** Temporary fail-closed boundary until schema-complement ownership and migration are implemented. */
export const assertBranchQuerySchemaOwnership = ({ adapter }: { adapter: object }): void => {
  if ((adapter as { allowAdditionalKeys?: boolean }).allowAdditionalKeys) {
    throw Object.assign(
      new Error(
        'Experimental branch query storage requires schema-complement ownership support before enabling MongoDB allowAdditionalKeys. Retain the legacy versions/drafts route until that support is available.',
      ),
      { code: 'branch-additional-keys-unsupported' },
    )
  }
}
