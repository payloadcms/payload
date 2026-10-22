import type { FindArgs } from '../../../database/types.js'
import type { Field } from '../../../fields/config/types.js'
import type { PayloadRequest, Where } from '../../../types/index.js'
import type { BranchContentScope, BranchHeadID } from '../types.js'
import type { BranchProjectionGuard } from './branchProjectionGuard.js'
import type { BranchQueryStorage } from './registerBranchQueryStorage.js'

import { executeAccess } from '../../../auth/executeAccess.js'
import {
  consumeBranchOriginalPolicy,
  readBranchOriginalGrant,
} from '../operations/branchOriginalPolicy.js'
import { assertBranchReadBinding, getBranchReadContext } from '../operations/branchReadContext.js'
import { collectOriginalReadTargets } from '../operations/collectOriginalReadTargets.js'
import {
  decodeBranchProjectionDocument,
  encodeBranchProjectionBranchKey,
  encodeBranchProjectionID,
} from './branchProjectionCodec.js'
import {
  collectBranchQueryLocales,
  compileBranchProjectionSort,
  compileBranchProjectionWhere,
} from './compileBranchProjectionWhere.js'
import { prepareBranchProjectionJoins } from './prepareBranchProjectionJoins.js'
import { assertBranchQuerySchemaOwnership } from './registerBranchQueryStorage.js'
import { selectBranchQueryData } from './selectBranchQueryData.js'
import {
  captureBranchReadProjectionGuards,
  withBranchReadSnapshot,
} from './withBranchReadSnapshot.js'

/**
 * Internal raw read boundary. Guards, original entity access predicates and native paging
 * finish before decoded logical content can reach application hooks. This does not invoke
 * field access, hooks or a separate population read; operation routing owns those stages.
 */
export const queryBranchContent = async (
  args: {
    branchID: BranchHeadID
    collection: string
    graphTargetIDs?: readonly BranchHeadID[]
    /** Known bounded references from the raw graph collector, never a public query option. */
    originalPolicy?: object
    overrideAccess?: boolean
    req: PayloadRequest
  } & Omit<FindArgs, 'collection' | 'req'>,
) => {
  const { originalPolicy, ...queryArgs } = args
  const originalAccess = consumeBranchOriginalPolicy({
    branchID: args.branchID,
    collection: args.collection,
    policy: originalPolicy,
    req: args.req,
  })
  return withBranchReadSnapshot({
    locale: args.locale,
    read: ({ req }) => queryRawBranchContent({ ...queryArgs, originalAccess, req }),
    req: args.req,
  })
}

const queryRawBranchContent = async ({
  branchID,
  collection,
  graphTargetIDs,
  originalAccess,
  overrideAccess = false,
  req,
  ...args
}: {
  branchID: BranchHeadID
  collection: string
  graphTargetIDs?: readonly BranchHeadID[]
  originalAccess?: object
  overrideAccess?: boolean
  req: PayloadRequest
} & Omit<FindArgs, 'collection' | 'req'>) => {
  const { context, locale, projectionSlugs, query, root, storage } =
    await prepareBranchContentQuery({
      branchID,
      collection,
      originalAccess,
      overrideAccess,
      req,
      ...args,
      observedJoins: args.joins ?? {},
      observedSort: args.sort ?? req.payload.collections[collection]?.config.defaultSort,
    })

  // Decode requires private nested identity and relationship metadata. Read full raw
  // rows and apply the caller's select after validation; native predicates still precede paging.
  const { projection: _projection, select, ...nativeArgs } = args
  const result = await query.find({
    ...nativeArgs,
    collection: storage?.projection ?? collection,
    context: {
      ...context,
      graphTarget: getGraphTarget({ branchID, collection, graphTargetIDs, req }),
    },
    locale,
    req,
    sort: compileBranchProjectionSort({ collection, req, sort: args.sort }),
    where: compileBranchProjectionWhere({ branchID, collection, req, where: args.where }),
  })

  return {
    ...result,
    docs: result.docs.map((data) =>
      selectBranchQueryData({
        blocks: req.payload.config.blocks,
        data: root.custom?.branchQueryStorage
          ? decodeBranchProjectionDocument({
              blocks: req.payload.config.blocks,
              branchID,
              data: data as Record<string, unknown>,
              fields: root.fields,
              isGlobal: typeof root.custom?.branchQueryGlobalSource === 'string',
              projectionSlugs,
              shouldClone: false,
            })
          : (data as Record<string, unknown>),
        fields: root.fields,
        select,
      }),
    ),
  }
}

/** Shared preparation for native find/count/distinct; no content-dependent user hook runs here. */
export const prepareBranchContentQuery = async ({
  branchID,
  collection,
  originalAccess,
  overrideAccess = false,
  req,
  ...args
}: {
  branchID: BranchHeadID
  collection: string
  observedField?: string
  observedJoins?: FindArgs['joins']
  observedSort?: FindArgs['sort']
  originalAccess?: object
  overrideAccess?: boolean
  req: PayloadRequest
} & Omit<FindArgs, 'collection' | 'req'>) => {
  assertBranchReadBinding({ req })
  const originalGrant = readBranchOriginalGrant({ grant: originalAccess })
  const rootOperationWhere = originalGrant?.where
  overrideAccess = originalGrant?.overrideAccess ?? overrideAccess
  assertBranchQuerySchemaOwnership({ adapter: req.payload.db })
  const query = req.payload.db.branching?.queryProjection
  const root = req.payload.collections[collection]?.config
  const storage = root?.custom?.branchQueryStorage as BranchQueryStorage | undefined

  if (!query || !root) {
    throw new Error('The requested entity does not have a native branch query relation.')
  }

  const projectionSlugs = Object.fromEntries(
    Object.values(req.payload.collections)
      .filter(({ config }) => config.custom?.branchQueryStorage)
      .map(({ config }) => [config.slug, config.custom.branchQueryStorage.projection as string]),
  )
  const relationAccess: Record<string, false | Where> = {}
  const reachable = getReachableCollections({ collection, req })
  const controls: BranchQueryStorage[] = []
  const localization = req.payload.config.localization
  const locale =
    args.locale ?? req.locale ?? (localization ? localization.defaultLocale : undefined)
  const requestedLocales = new Set<string>(
    localization ? (locale && locale !== 'all' ? [locale] : localization.localeCodes) : [],
  )

  for (const code of collectBranchQueryLocales({
    collection,
    req,
    sort: args.observedSort,
    where: args.where,
  })) {
    requestedLocales.add(code)
  }
  if (rootOperationWhere !== undefined) {
    for (const code of collectBranchQueryLocales({ collection, req, where: rootOperationWhere })) {
      requestedLocales.add(code)
    }
  }
  if (args.observedField) {
    for (const code of collectBranchQueryLocales({ collection, req, sort: args.observedField })) {
      requestedLocales.add(code)
    }
  }
  const preparedJoins =
    args.observedJoins === undefined
      ? undefined
      : prepareBranchProjectionJoins({ branchID, collection, joins: args.observedJoins, req })
  for (const code of preparedJoins?.locales ?? []) {
    requestedLocales.add(code)
  }
  if (localization) {
    const fallback = req.fallbackLocale
    for (const code of Array.isArray(fallback)
      ? fallback
      : typeof fallback === 'string'
        ? [fallback]
        : []) {
      if (localization.localeCodes.includes(code)) {
        requestedLocales.add(code)
      }
    }
  }
  const originalReadTargets =
    rootOperationWhere !== undefined && !overrideAccess
      ? collectOriginalReadTargets({
          collection,
          req,
          sort: [
            ...(typeof (args.observedSort ?? args.sort) === 'string'
              ? [args.observedSort ?? (args.sort as string)]
              : (args.observedSort ?? args.sort ?? [])),
            ...(args.observedField ? [args.observedField] : []),
            ...Object.keys(args.observedJoins || {}),
          ] as string[],
          where: args.where,
        })
      : undefined
  if (originalReadTargets && args.observedJoins !== false) {
    const config = req.payload.collections[collection]!.config
    for (const definition of [
      ...Object.values(config.joins ?? {}).flat(),
      ...(config.polymorphicJoins ?? []),
    ]) {
      const options = args.observedJoins?.[definition.joinPath]
      if (options === false) {
        continue
      }
      const targets =
        typeof definition.field.collection === 'string'
          ? [definition.field.collection]
          : definition.field.collection
      for (const target of targets) {
        originalReadTargets.add(target)
        for (const observed of collectOriginalReadTargets({
          collection: target,
          req,
          sort:
            options?.sort ??
            definition.field.defaultSort ??
            req.payload.collections[target]!.config.defaultSort,
          where: options?.where ?? definition.field.where,
        })) {
          originalReadTargets.add(observed)
        }
      }
    }
  }
  for (const slug of reachable) {
    const config = req.payload.collections[slug]!.config
    const control = config.custom?.branchQueryStorage as BranchQueryStorage | undefined
    const access =
      originalReadTargets && !originalReadTargets.has(slug)
        ? false
        : overrideAccess
          ? true
          : await executeAccess({ slug, disableErrors: true, req }, config.access.read)

    if (access && typeof access === 'object') {
      for (const code of collectBranchQueryLocales({ collection: slug, req, where: access })) {
        requestedLocales.add(code)
      }
    }
    relationAccess[control?.projection ?? slug] =
      access === false
        ? false
        : access === true
          ? {}
          : compileBranchProjectionWhere({ branchID, collection: slug, req, where: access })
  }
  assertBranchReadBinding({ req })
  const scopes: BranchContentScope[] = [
    { type: 'shared' },
    ...[...requestedLocales].map((locale): BranchContentScope => ({ type: 'locale', locale })),
  ]

  for (const slug of reachable) {
    const control = req.payload.collections[slug]!.config.custom?.branchQueryStorage as
      | BranchQueryStorage
      | undefined
    if (control) {
      controls.push(control)
    }
  }
  const guards: BranchProjectionGuard[] = await captureBranchReadProjectionGuards({
    branchID,
    controls,
    req,
    scopes,
  })

  return {
    context: {
      branchKey: encodeBranchProjectionBranchKey({ branchID }),
      materializedCollections: getBranchReadContext({ req })?.materializedCollections,
      materializedVisibility: getBranchReadContext({ req })?.materializedVisibility,
      ...(rootOperationWhere !== undefined
        ? {
            rootAccess: {
              collection: storage?.projection ?? collection,
              where: compileBranchProjectionWhere({
                branchID,
                collection,
                req,
                where: rootOperationWhere,
              }),
            },
          }
        : {}),
      joins: preparedJoins?.joins,
      relationAccess,
    },
    guards,
    locale,
    projectionSlugs,
    query,
    root,
    storage: storage ?? { projection: collection },
  }
}

/** Finite schema graph; never inventories content IDs in application memory. */
export const getReachableCollections = ({
  collection,
  req,
}: {
  collection: string
  req: PayloadRequest
}): string[] => {
  const visited = new Set<string>()
  const visit = ({ slug }: { slug: string }): void => {
    if (visited.has(slug)) {
      return
    }
    const config = req.payload.collections[slug]?.config
    if (!config) {
      throw new Error('Unknown branch query relationship target.')
    }
    visited.add(slug)
    visitFields({ fields: config.fields })
  }
  const visitFields = ({ fields }: { fields: Field[] }): void => {
    for (const field of fields) {
      if (field.type === 'relationship' || field.type === 'upload' || field.type === 'join') {
        const target = field.type === 'join' ? field.collection : field.relationTo
        for (const slug of typeof target === 'string' ? [target] : target) {
          visit({ slug })
        }
      } else if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          visitFields({ fields: tab.fields })
        }
      } else if ('fields' in field) {
        visitFields({ fields: field.fields })
      } else if (field.type === 'blocks') {
        for (const block of field.blocks) {
          visitFields({
            fields: typeof block === 'string' ? req.payload.blocks[block]!.fields : block.fields,
          })
        }
      }
    }
  }

  visit({ slug: collection })
  return [...visited]
}

/** Target only the collector's bounded, typed references in their registered private root. */
const getGraphTarget = ({
  branchID,
  collection,
  graphTargetIDs,
  req,
}: {
  branchID: BranchHeadID
  collection: string
  graphTargetIDs?: readonly BranchHeadID[]
  req: PayloadRequest
}): { collection: string; ids: string[] } | undefined => {
  if (
    req.payload.db.name !== 'mongoose' ||
    !Array.isArray(graphTargetIDs) ||
    !graphTargetIDs.length ||
    graphTargetIDs.length > 50
  ) {
    return undefined
  }
  const source = req.payload.collections[collection]?.config
  const projection = source?.custom?.branchQueryStorage?.projection
  const target =
    typeof projection === 'string' ? req.payload.collections[projection]?.config : undefined
  if (
    !source ||
    !target ||
    source.custom?.branchQueryGlobalSource ||
    target.custom?.branchProjectionStorage?.global ||
    target.custom?.branchProjectionStorage?.collection !== collection
  ) {
    return undefined
  }
  const sourceID = source.fields.find((field) => 'name' in field && field.name === 'id')
  const kind =
    sourceID?.type === 'number' ? 'number' : sourceID ? 'text' : req.payload.db.defaultIDType
  const metadata = target.fields.find(
    (field) => 'name' in field && field.name === '_branchProjection',
  )
  const logicalID =
    metadata?.type === 'group'
      ? metadata.fields.find((field) => 'name' in field && field.name === 'logicalID')
      : undefined
  if (
    (kind !== 'number' && kind !== 'text') ||
    logicalID?.type !== kind ||
    graphTargetIDs.some((id) =>
      kind === 'number'
        ? typeof id !== 'number' || !Number.isFinite(id)
        : typeof id !== 'string' || id.length === 0,
    )
  ) {
    return undefined
  }
  return {
    collection: projection,
    ids: graphTargetIDs.map((logicalID) => encodeBranchProjectionID({ branchID, logicalID })),
  }
}
