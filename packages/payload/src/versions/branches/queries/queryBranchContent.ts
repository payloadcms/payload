import type { FindArgs } from '../../../database/types.js'
import type { Field } from '../../../fields/config/types.js'
import type { PayloadRequest, Where } from '../../../types/index.js'
import type { BranchContentScope, BranchHeadID } from '../types.js'
import type { BranchProjectionGuard } from './branchProjectionGuard.js'
import type { BranchQueryStorage } from './registerBranchQueryStorage.js'

import { executeAccess } from '../../../auth/executeAccess.js'
import {
  decodeBranchProjectionDocument,
  encodeBranchProjectionBranchKey,
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
  captureBranchReadProjectionGuard,
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
    overrideAccess?: boolean
    req: PayloadRequest
  } & Omit<FindArgs, 'collection' | 'req'>,
) => {
  return withBranchReadSnapshot({
    locale: args.locale,
    read: ({ req }) => queryRawBranchContent({ ...args, req }),
    req: args.req,
  })
}

const queryRawBranchContent = async ({
  branchID,
  collection,
  overrideAccess = false,
  req,
  ...args
}: {
  branchID: BranchHeadID
  collection: string
  overrideAccess?: boolean
  req: PayloadRequest
} & Omit<FindArgs, 'collection' | 'req'>) => {
  const { context, locale, projectionSlugs, query, root, storage } =
    await prepareBranchContentQuery({
      branchID,
      collection,
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
    context,
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
  overrideAccess = false,
  req,
  ...args
}: {
  branchID: BranchHeadID
  collection: string
  observedField?: string
  observedJoins?: FindArgs['joins']
  observedSort?: FindArgs['sort']
  overrideAccess?: boolean
  req: PayloadRequest
} & Omit<FindArgs, 'collection' | 'req'>) => {
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
  const guards: BranchProjectionGuard[] = []
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
  for (const slug of reachable) {
    const config = req.payload.collections[slug]!.config
    const control = config.custom?.branchQueryStorage as BranchQueryStorage | undefined
    const access = overrideAccess
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
  const scopes: BranchContentScope[] = [
    { type: 'shared' },
    ...[...requestedLocales].map((locale): BranchContentScope => ({ type: 'locale', locale })),
  ]

  for (const slug of reachable) {
    const control = req.payload.collections[slug]!.config.custom?.branchQueryStorage as
      | BranchQueryStorage
      | undefined
    if (control) {
      guards.push(await captureBranchReadProjectionGuard({ branchID, control, req, scopes }))
    }
  }

  return {
    context: {
      branchKey: encodeBranchProjectionBranchKey({ branchID }),
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
const getReachableCollections = ({
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
