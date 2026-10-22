import type { PayloadRequest, Where } from '../../../types/index.js'
import type { BranchStorageTarget } from '../storage/branchStorage.js'
import type { BranchContentScope, BranchHeadID, BranchVersionReference } from '../types.js'
import type { BranchQueryStorage } from './registerBranchQueryStorage.js'

import { hasLocalizeStatusEnabled } from '../../../utilities/getVersionsConfig.js'
import { compileBranchScopeFields } from '../compileBranchScopeFields.js'
import { readBranchHeads } from '../storage/branchHeadStore.js'
import {
  isBranchIdentityVisible,
  readBranchIdentityVisibility,
} from '../storage/branchIdentityStore.js'
import {
  assertBranchTransaction,
  getBranchKey,
  getBranchStorage,
} from '../storage/branchStorage.js'
import {
  encodeBranchProjectionBranchKey,
  encodeBranchProjectionDocument,
  encodeBranchProjectionID,
} from './branchProjectionCodec.js'
import {
  initializeBranchProjectionScope,
  invalidateBranchProjection,
  lockBranchProjectionMain,
  registerBranchProjectionScopes,
  settleBranchProjectionInvalidation,
} from './branchProjectionGuard.js'
import { collectBranchProjectionRelationships } from './branchProjectionRelationships.js'
import { branchProjectionMetadataField } from './buildBranchProjectionCollections.js'
import { completeBranchProjectionData } from './completeBranchProjectionData.js'
import { composeBranchProjection } from './composeBranchProjection.js'
import { assertBranchQuerySchemaOwnership } from './registerBranchQueryStorage.js'

/** Maintain a derived relation atomically with its authoritative mutation; never touches live content. */
export const maintainBranchProjections = async ({
  branchID,
  isVisibilityChange = false,
  req,
  target,
}: {
  branchID: BranchHeadID
  isVisibilityChange?: boolean
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<void> => {
  const context = getContext({ req, target })

  if (!context) {
    return
  }

  await assertBranchTransaction({ req })
  await lockBranchProjectionMain({ control: context.storage, req })
  await rebuildBranchProjectionWithMainLock({ branchID, hasMainLock: true, req, target })

  if (branchID !== 'main' && !isVisibilityChange) {
    return
  }

  // Branch catalog inventory is bounded per database page; document identities never fan out here.
  let afterID: BranchHeadID | undefined

  for (;;) {
    const result = await req.payload.db.find<{ branchKey: string; id: BranchHeadID }>({
      collection: context.storage.states,
      limit: 100,
      pagination: false,
      req,
      sort: 'id',
      where: {
        and: [
          { scopeKey: { equals: 'shared' } },
          ...(afterID === undefined ? [] : [{ id: { greater_than: afterID } }]),
        ],
      },
    })

    for (const row of result.docs) {
      const selectedBranchID = decodeBranchKey({ key: row.branchKey })

      if (selectedBranchID !== branchID) {
        await rebuildBranchProjectionWithMainLock({
          branchID: selectedBranchID,
          hasMainLock: true,
          req,
          target,
        })
      }
    }
    if (result.docs.length < 100) {
      break
    }
    afterID = result.docs[result.docs.length - 1]!.id
  }
}

/** Rebuild from authoritative state only after acquiring the native main dependency. */
export const rebuildBranchProjection = async (args: {
  branchID: BranchHeadID
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<void> => rebuildBranchProjectionWithMainLock(args)

/** One resumable, bounded identity page. Run each page in its own caller transaction. */
export const bootstrapBranchProjectionPage = async ({
  branchID,
  collection,
  limit = 100,
  req,
}: {
  branchID: BranchHeadID
  collection: string
  limit?: number
  req: PayloadRequest
}): Promise<{ isComplete: boolean; processed: number }> => {
  await assertBranchTransaction({ req })
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) {
    throw new Error('Branch projection bootstrap page size must be between 1 and 1000.')
  }
  const context = getBootstrapContext({ collection, req })

  if (!context) {
    throw new Error('Branch query storage is not registered.')
  }
  const { entity, scopes, storage } = context

  await lockBranchProjectionMain({ control: storage, req })
  await registerBranchProjectionScopes({ branchID, control: storage, req, scopes })
  const state = await req.payload.db.findOne<{
    bootstrapCursor?: BranchHeadID
    id: BranchHeadID
    isInitialized: boolean
  }>({
    collection: storage.states,
    req,
    where: {
      and: [
        { branchKey: { equals: getBranchKey({ branchID }) } },
        { scopeKey: { equals: 'shared' } },
      ],
    },
  })

  if (!state) {
    throw new Error('Missing registered branch projection scope.')
  }
  if (state.isInitialized) {
    return { isComplete: true, processed: 0 }
  }
  const rows =
    entity.type === 'collection'
      ? (
          await req.payload.db.find<{ id: BranchHeadID }>({
            collection: entity.slug,
            joins: false,
            limit,
            pagination: false,
            req,
            sort: 'id',
            where:
              state.bootstrapCursor == null ? {} : { id: { greater_than: state.bootstrapCursor } },
          })
        ).docs
      : [{ id: 'singleton' }]

  for (const row of rows) {
    await rebuildBranchProjectionWithMainLock({
      branchID,
      hasMainLock: true,
      req,
      target: entity.type === 'collection' ? { collection, parentID: row.id } : { collection },
    })
  }
  const isComplete = entity.type === 'global' || rows.length < limit

  if (isComplete) {
    for (const scope of scopes) {
      // Conflicted locales intentionally remain unavailable while unaffected scopes finish bootstrap.
      const pending = await req.payload.db.findOne({
        collection: storage.invalidations,
        req,
        where: {
          and: [
            { branchKey: { equals: getBranchKey({ branchID }) } },
            { scopeKey: { equals: scope.type === 'shared' ? 'shared' : `locale:${scope.locale}` } },
          ],
        },
      })

      if (!pending) {
        await initializeBranchProjectionScope({ branchID, control: storage, req, scope })
      }
    }
  } else {
    await req.payload.db.updateOne({
      collection: storage.states,
      data: { bootstrapCursor: rows[rows.length - 1]!.id },
      req,
      where: { id: { equals: state.id } },
    })
  }

  return { isComplete, processed: rows.length }
}

/** Rebuild one logical identity from exact frozen revisions and all configured scopes. */
const rebuildBranchProjectionWithMainLock = async ({
  branchID,
  hasMainLock = false,
  req,
  target,
}: {
  branchID: BranchHeadID
  hasMainLock?: boolean
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<void> => {
  await assertBranchTransaction({ req })
  const context = getContext({ req, target })

  if (!context) {
    throw new Error('Branch query storage is not registered.')
  }
  const { config, entity, logicalID, scopes, storage } = context

  if (!hasMainLock) {
    await lockBranchProjectionMain({ control: storage, req })
  }
  await registerBranchProjectionScopes({ branchID, control: storage, req, scopes })
  const invalidations = []

  for (const scope of scopes) {
    invalidations.push(
      await invalidateBranchProjection({ branchID, control: storage, logicalID, req, scope }),
    )
  }
  const selections = scopes.flatMap((scope) => [
    { branchID: 'main', scope },
    ...(branchID === 'main' ? [] : [{ branchID, scope }]),
  ])
  const tokens = await readBranchHeads({ req, selections, target })
  const resolved = scopes.map((scope, index) => {
    const main = tokens[index * (branchID === 'main' ? 1 : 2)]!.state
    const owned = branchID === 'main' ? main : tokens[index * 2 + 1]!.state

    return { main, scope, selected: owned ?? main }
  })
  const references = new Map<string, BranchVersionReference>()

  for (const { main, selected } of resolved) {
    for (const state of [main, selected]) {
      if (state?.type === 'version') {
        references.set(
          JSON.stringify([typeof state.version.id, state.version.id, state.version.generation]),
          state.version,
        )
        if (state.structure) {
          references.set(
            JSON.stringify([
              typeof state.structure.id,
              state.structure.id,
              state.structure.generation,
            ]),
            state.structure,
          )
        }
      }
    }
  }
  const versions: { data: Record<string, unknown>; reference: BranchVersionReference }[] = []

  if (references.size) {
    const where: Where = {
      and: [
        ...(entity.type === 'collection' ? [{ parent: { equals: entity.parentID } }] : []),
        {
          or: [...references.values()].map(({ id, generation }): Where => ({
            and: [{ id: { equals: id } }, { branchGeneration: { equals: generation } }],
          })),
        },
      ],
    }
    const args = { limit: references.size, locale: 'all' as const, pagination: false, req, where }
    const rows =
      entity.type === 'collection'
        ? await req.payload.db.findVersions({ ...args, collection: entity.slug })
        : await req.payload.db.findGlobalVersions({ ...args, global: entity.slug })

    if (rows.docs.length !== references.size) {
      throw new Error('A branch query projection references a missing exact version revision.')
    }
    for (const row of rows.docs) {
      versions.push({
        data: row.version,
        reference: { id: row.id, generation: row.branchGeneration as number },
      })
    }
  }
  const composed = composeBranchProjection({
    fields: compileBranchScopeFields({ blocks: req.payload.config.blocks, fields: config.fields }),
    isStatusLocalized: hasLocalizeStatusEnabled(config),
    logicalID,
    scopes: resolved,
    versions,
  })
  const visibility = await readBranchIdentityVisibility({ req, target })
  const hasMainShared = resolved[0]!.main?.type === 'version'
  const hasOwnedGlobalVersion =
    entity.type === 'global' &&
    branchID !== 'main' &&
    tokens.some((token) => token.branchID === branchID && token.state?.type === 'version')
  const isVisible =
    composed.hasSharedContent &&
    (hasOwnedGlobalVersion ||
      (visibility ? isBranchIdentityVisible({ branchID, visibility }) : hasMainShared))
  const projectionSlugs = getProjectionSlugs({ req })

  await ensureSkeleton({ branchID, logicalID, projection: storage.projection, req })
  for (const reference of collectBranchProjectionRelationships({
    blocks: req.payload.config.blocks,
    data: composed.data,
    fields: config.fields,
    projectionSlugs,
  })) {
    await ensureSkeleton({
      branchID,
      logicalID: reference.logicalID,
      projection: projectionSlugs[reference.collection]!,
      req,
    })
  }
  const id = encodeBranchProjectionID({ branchID, logicalID })
  const previous = await req.payload.db.findOne<{ [key: string]: unknown; id: string }>({
    collection: storage.projection,
    joins: false,
    locale: 'all',
    req,
    where: { id: { equals: id } },
  })
  const encoded = encodeBranchProjectionDocument({
    blocks: req.payload.config.blocks,
    branchID,
    data: composed.data,
    fields: config.fields,
    isVisible,
    logicalID,
    projectionSlugs,
  })
  if (entity.type === 'global') {
    const native = await req.payload.db.findGlobal({
      slug: entity.slug,
      locale: 'all',
      req,
      select: { id: true },
    })
    const metadata = encoded[branchProjectionMetadataField] as Record<string, unknown>
    if (native?.id == null) {
      delete metadata.nativeGlobalID
    } else {
      metadata.nativeGlobalID = native.id
    }
  }
  const data = completeBranchProjectionData({
    blocks: req.payload.config.blocks,
    fields: req.payload.collections[storage.projection]!.config.fields,
    locales: getLocales({ req }),
    previous: previous ?? {},
    replacement: encoded,
  })

  if (req.payload.db.branching?.replaceProjection) {
    await req.payload.db.branching.replaceProjection({
      collection: storage.projection,
      replacement: encoded,
      req,
    })
  } else {
    await req.payload.db.updateOne({
      collection: storage.projection,
      data,
      locale: 'all',
      req,
      returning: false,
      where: { id: { equals: id } },
    })
  }
  for (const expected of invalidations) {
    await settleBranchProjectionInvalidation({
      control: storage,
      expected,
      hasStructuralConflict: composed.conflictedLocales.some(
        (locale) => expected.scopeKey === `locale:${locale}`,
      ),
      req,
    })
  }
  const inventory = await req.payload.db.findOne<{ id: BranchHeadID; isInitialized: boolean }>({
    collection: storage.states,
    req,
    where: {
      and: [
        { branchKey: { equals: getBranchKey({ branchID }) } },
        { scopeKey: { equals: 'shared' } },
      ],
    },
  })

  if (inventory?.isInitialized) {
    for (const scope of scopes) {
      if (scope.type === 'locale' && !composed.conflictedLocales.includes(scope.locale)) {
        const pending = await req.payload.db.findOne({
          collection: storage.invalidations,
          req,
          where: {
            and: [
              { branchKey: { equals: getBranchKey({ branchID }) } },
              { scopeKey: { equals: `locale:${scope.locale}` } },
            ],
          },
        })

        if (!pending) {
          await initializeBranchProjectionScope({ branchID, control: storage, req, scope })
        }
      }
    }
  }
}

const getContext = ({ req, target }: { req: PayloadRequest; target: BranchStorageTarget }) => {
  const { entity } = getBranchStorage({ req, target })
  const config =
    entity.type === 'collection'
      ? req.payload.collections[entity.slug]!.config
      : req.payload.globals.config.find(({ slug }) => slug === entity.slug)!
  const storage = config.custom?.branchQueryStorage as BranchQueryStorage | undefined

  if (storage) {
    assertBranchQuerySchemaOwnership({ adapter: req.payload.db })
  }

  return storage
    ? {
        config,
        entity,
        logicalID: entity.type === 'collection' ? entity.parentID : 'singleton',
        scopes: [
          { type: 'shared' },
          ...getLocales({ req }).map((locale) => ({ type: 'locale', locale })),
        ] as BranchContentScope[],
        storage,
      }
    : null
}

const getLocales = ({ req }: { req: PayloadRequest }): string[] =>
  req.payload.config.localization ? req.payload.config.localization.localeCodes : []

const getProjectionSlugs = ({ req }: { req: PayloadRequest }): Record<string, string> =>
  Object.fromEntries(
    Object.values(req.payload.collections)
      .filter(({ config }) => config.custom?.branchQueryStorage)
      .map(({ config }) => [config.slug, config.custom.branchQueryStorage.projection]),
  )

const decodeBranchKey = ({ key }: { key: string }): BranchHeadID => {
  if (key.startsWith('string:')) {
    return key.slice(7)
  }
  if (key.startsWith('number:')) {
    const value = Number(key.slice(7))

    if (Number.isFinite(value) && getBranchKey({ branchID: value }) === key) {
      return value
    }
  }
  throw new Error('Invalid registered branch projection identity.')
}

const ensureSkeleton = async ({
  branchID,
  logicalID,
  projection,
  req,
}: {
  branchID: BranchHeadID
  logicalID: BranchHeadID
  projection: string
  req: PayloadRequest
}): Promise<void> => {
  const id = encodeBranchProjectionID({ branchID, logicalID })

  if (
    !(await req.payload.db.findOne({
      collection: projection,
      joins: false,
      req,
      where: { id: { equals: id } },
    }))
  ) {
    await req.payload.db.create({
      collection: projection,
      data: {
        id,
        _branchProjection: {
          branchKey: encodeBranchProjectionBranchKey({ branchID }),
          isVisible: false,
          logicalID,
        },
      },
      req,
      returning: false,
    })
  }
}

const getBootstrapContext = ({ collection, req }: { collection: string; req: PayloadRequest }) => {
  const marker = req.payload.collections[collection]?.config.custom?.branchHeadStorage

  if (!marker) {
    throw new Error('Bootstrap requires a registered internal head storage collection.')
  }
  const config =
    marker.parentCollection === null
      ? req.payload.globals.config.find(({ slug }) => slug === marker.globalSlug)
      : req.payload.collections[marker.parentCollection]?.config
  const storage = config?.custom?.branchQueryStorage as BranchQueryStorage | undefined

  if (
    !storage ||
    storage.states === undefined ||
    config?.custom?.branchStorage?.heads !== collection
  ) {
    throw new Error('Branch query storage is not registered.')
  }

  return {
    entity: {
      slug: config.slug,
      type: marker.parentCollection === null ? ('global' as const) : ('collection' as const),
    },
    scopes: [
      { type: 'shared' },
      ...getLocales({ req }).map((locale) => ({ type: 'locale', locale })),
    ] as BranchContentScope[],
    storage,
  }
}
