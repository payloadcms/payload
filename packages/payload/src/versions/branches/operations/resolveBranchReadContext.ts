import type { CollectionPermission } from '../../../auth/types.js'
import type { AccessResult } from '../../../config/types.js'
import type { FindArgs, FindDistinctArgs } from '../../../database/types.js'
import type { Field } from '../../../fields/config/types.js'
import type { PayloadRequest, Where } from '../../../types/index.js'

import { executeAccess } from '../../../auth/executeAccess.js'
import { sanitizeSortQuery } from '../../../collections/operations/utilities/sanitizeSortQuery.js'
import { validateQueryPaths } from '../../../database/queryValidation/validateQueryPaths.js'
import { validateSortQuery } from '../../../database/queryValidation/validateSortQuery.js'
import { sanitizeJoinQuery } from '../../../database/sanitizeJoinQuery.js'
import { sanitizeWhereQuery } from '../../../database/sanitizeWhereQuery.js'
import { APIError } from '../../../errors/APIError.js'
import { Forbidden } from '../../../errors/Forbidden.js'
import { createBranchReadRequest } from '../../../utilities/createBranchReadRequest.js'
import { populateFieldPermissions } from '../../../utilities/getEntityPermissions/populateFieldPermissions.js'
import { getFieldByPath } from '../../../utilities/getFieldByPath.js'
import { countBranchContent, findDistinctBranchContent } from '../queries/queryBranchAggregates.js'
import {
  getReachableCollections,
  prepareBranchContentQuery,
  queryBranchContent,
} from '../queries/queryBranchContent.js'
import { createBranchGlobalSourceRequest } from '../queries/queryBranchGlobal.js'
import { selectBranchQueryData } from '../queries/selectBranchQueryData.js'
import { withBranchReadSnapshot } from '../queries/withBranchReadSnapshot.js'
import { readBranchHeads } from '../storage/branchHeadStore.js'
import { readBranchIdentityVisibility } from '../storage/branchIdentityStore.js'
import { assertBranchReadBinding } from './assertBranchReadBinding.js'
import { consumeBranchOriginalPolicy, createBranchOriginalPolicy } from './branchOriginalPolicy.js'
import {
  getBranchReadContext,
  getBranchReadIntent,
  registerBranchReadContext,
} from './branchReadContext.js'
import { readBranchCutover } from './readBranchCutover.js'
import { normalizeBranchOriginal } from './resolveBranchOriginal.js'
import { getSelectedBranch } from './selectedBranchContext.js'

/** Only a registered native boundary can acquire authoritative public raw rows. */
export const hasBranchReadCandidates = ({ req }: { req: PayloadRequest }): boolean =>
  !!req.payload.db.branching?.withReadSnapshot &&
  (!!getBranchReadContext({ req }) ||
    [
      ...Object.values(req.payload.collections).map(({ config }) => config),
      ...(req.payload.globals?.config ?? []),
    ].some((config) => config.custom?.branchQueryStorage && config.custom?.branchStorage))

type Args = {
  collection: string
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  global?: string
  id?: number | string
  kind: 'count' | 'distinct' | 'find'
  legacyReq?: PayloadRequest
  native: Omit<FindArgs, 'collection' | 'req'> & Partial<Pick<FindDistinctArgs, 'field'>>
  originalField?: string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

export const resolveBranchCollectionRead = async ({
  id,
  collection,
  depth,
  disableErrors,
  draft,
  global,
  kind,
  legacyReq,
  native,
  originalField,
  overrideAccess = false,
  req,
  showHiddenFields = false,
}: Args): Promise<{
  accessResult?: AccessResult
  assertLegacy?: () => Promise<void>
  denied?: boolean
  legacy?: boolean
  result?: any
} | null> => {
  if (!hasBranchReadCandidates({ req })) {
    if (getBranchReadIntent({ req }) !== undefined || getSelectedBranch({ req }) !== undefined) {
      throw new Error(
        'Selected branch reads require authoritative cutover and native snapshot support.',
      )
    }
    return null
  }
  return withBranchReadSnapshot({
    locale: native.locale,
    read: async ({ req: snapshotReq }) => {
      const inherited = getBranchReadContext({ req: snapshotReq })
      const selection =
        getBranchReadIntent({ req }) ??
        getSelectedBranch({ req }) ??
        (inherited?.isEffective ? inherited.branchID : undefined)
      const branchID = selection ?? (draft ? 'drafts' : 'main')
      const sources = inherited?.sources ?? snapshotReq.payload.collections
      const metadataReq = createBranchReadRequest({
        payload: Object.create(snapshotReq.payload, {
          collections: { enumerable: true, value: sources },
        }),
        req: snapshotReq,
      })
      const collections = { ...sources }
      const targetPolicies = new Map<string, Promise<AccessResult>>()
      let isRootPolicy = true
      let assertPolicyRequest = (_req: PayloadRequest): void => {
        throw new Error('The branch read policy context is not admitted.')
      }
      const materializedVisibility = { ...inherited?.materializedVisibility }
      const materializedCollections = new Set(inherited?.materializedCollections)
      let hasAuthority = !!inherited
      let hasRootAuthority = false
      const admitted = new Set<string>()
      const effective = new Set<string>()
      const reachable = getReachableCollections({ collection, req: metadataReq })
      for (const slug of reachable) {
        const entity = sources[slug]!
        const config = entity.config
        if (!config.custom?.branchQueryStorage || !config.custom?.branchStorage) {
          materializedCollections.add(slug)
          continue
        }
        const authority =
          slug === collection && global
            ? metadataReq.payload.globals.config.find(({ slug }) => slug === global)!
            : config
        const receipt = await readBranchCutover({ entity: authority, req: metadataReq })
        if (receipt) {
          hasAuthority = true
          admitted.add(slug)
          if (slug === collection) {
            hasRootAuthority = true
          }
        }
        const isEffective = !!receipt && (selection !== undefined || draft === true)
        if (!isEffective) {
          materializedCollections.add(slug)
          if (receipt && !(global && slug === collection)) {
            materializedVisibility[slug] = config.custom.branchStorage.identities
          }
        } else {
          materializedCollections.delete(slug)
          delete materializedVisibility[slug]
          effective.add(slug)
        }
      }
      for (const projected of effective) {
        const pending = [projected]
        const visited = new Set<string>()
        while (pending.length) {
          const source = pending.pop()!
          if (visited.has(source)) {
            continue
          }
          visited.add(source)
          for (const dependency of collectEncodedDependencies({
            fields: sources[source]!.config.fields,
            req: metadataReq,
          })) {
            if (!sources[dependency]?.config.custom?.branchQueryStorage) {
              continue
            }
            if (!admitted.has(dependency)) {
              throw Object.assign(
                new Error(
                  `Authoritative branch reads require complete encoding dependency cutover: ${dependency}.`,
                ),
                { code: 'branch-read-dependency-not-ready' },
              )
            }
            pending.push(dependency)
          }
        }
      }
      if (
        selection !== undefined &&
        (global
          ? metadataReq.payload.globals.config.find(({ slug }) => slug === global)?.versions?.drafts
          : sources[collection]?.config.versions?.drafts) &&
        !hasRootAuthority
      ) {
        throw new Error(
          'Selected branch reads require authoritative cutover for the requested collection.',
        )
      }
      if (!hasAuthority) {
        if (selection !== undefined) {
          throw new Error('Selected branch reads require authoritative cutover.')
        }
        const legacySource = legacyReq ?? req
        const payload = legacySource.payload
        const absentReceipts = reachable.flatMap((slug) => {
          const cutover = sources[slug]?.config.custom?.branchStorage?.cutover
          return typeof cutover === 'string' ? [cutover] : []
        })
        return {
          assertLegacy: async () => {
            if (legacySource.payload !== payload) {
              throw new Error(
                'A legacy branch read cannot rebind its Payload before authority validation.',
              )
            }
            // M9 must retain receipt tombstones: activated authority never becomes absent again.
            // The postflight is before hooks/output; no application callback is replayed.
            for (const cutover of absentReceipts) {
              const receipt = await payload.db.findOne({
                collection: cutover,
                req: legacySource,
                where: { singleton: { equals: 'authoritative' } },
              })
              if (receipt) {
                throw new Error(
                  'Authoritative branch cutover changed during legacy read acquisition.',
                )
              }
            }
          },
          legacy: true,
        }
      }
      for (const [slug, entity] of Object.entries(sources)) {
        if (!reachable.includes(slug)) {
          materializedCollections.add(slug)
        }
        if (materializedCollections.has(slug)) {
          const { branchQueryStorage: _queryStorage, ...custom } = entity.config.custom ?? {}
          collections[slug] = { ...entity, config: { ...entity.config, custom } }
        }
      }
      for (const [slug, entity] of Object.entries(collections)) {
        const originalRead = sources[slug]!.config.access.read
        collections[slug] = {
          ...entity,
          config: {
            ...entity.config,
            access: {
              ...entity.config.access,
              read: async (args) => {
                assertPolicyRequest(args.req)
                const key = `${isRootPolicy && slug === collection ? 'root' : 'target'}:${slug}`
                let decision = targetPolicies.get(key)
                if (!decision) {
                  decision = Promise.resolve()
                    .then(() => (originalRead ? originalRead(args) : Boolean(args.req.user)))
                    .then((result) => structuredClone(result))
                  targetPolicies.set(key, decision)
                }
                return structuredClone(await decision)
              },
            },
          },
        }
      }
      const scopedReq = createBranchReadRequest({
        payload: Object.create(snapshotReq.payload, {
          collections: { enumerable: true, value: collections },
        }),
        req: snapshotReq,
      })
      registerBranchReadContext({
        context: {
          binding: structuredClone({
            fallbackLocale: scopedReq.fallbackLocale,
            locale: scopedReq.locale,
            user: scopedReq.user,
          }),
          branchID,
          isEffective: selection !== undefined || draft === true,
          materializedCollections: [...materializedCollections],
          materializedVisibility,
          sources,
        },
        req: scopedReq,
      })
      const operationContext = getBranchReadContext({ req: scopedReq })!
      assertPolicyRequest = (policyReq) => {
        // Touching the captured capability also rejects use after this native frame closes.
        if (
          getBranchReadContext({ req: policyReq }) !== operationContext ||
          policyReq.payload.db !== scopedReq.payload.db ||
          policyReq.transactionID !== scopedReq.transactionID
        ) {
          throw new Error('The branch read policy request lost its admitted native context.')
        }
        assertBranchReadBinding({ req: policyReq })
      }
      const config = scopedReq.payload.collections[collection]!.config
      const access = overrideAccess
        ? true
        : await executeAccess(
            { id, slug: collection, disableErrors, req: scopedReq },
            config.access.read,
          )
      isRootPolicy = false
      assertBranchReadBinding({ req: scopedReq })
      if (access === false) {
        return { accessResult: false, denied: true, result: null }
      }
      const rootPermissions: CollectionPermission = {
        fields: {},
        read: {
          permission: true,
          ...(typeof access === 'object' ? { where: access as Where } : {}),
        },
      }
      const permissionWork: Promise<void>[] = []
      const hasFieldPredicate = (where: Where): boolean =>
        Object.entries(where).some(([path, value]) =>
          ['and', 'or'].includes(path.toLowerCase()) && Array.isArray(value)
            ? value.some((child) => hasFieldPredicate(child))
            : path !== 'id',
        )
      const shouldPrepareFieldPermissions =
        kind === 'distinct' || !!native.sort || hasFieldPredicate(native.where ?? {})
      if (!overrideAccess && shouldPrepareFieldPermissions) {
        populateFieldPermissions({
          blockReferencesPermissions: {},
          collection: config,
          data: undefined,
          fields: config.fields,
          global: null,
          operations: ['read'],
          parentPermissionsObject: rootPermissions,
          permissionsObject: rootPermissions.fields,
          promises: permissionWork,
          req: scopedReq,
        })
      }
      let completed = 0
      while (completed < permissionWork.length) {
        const current = permissionWork.slice(completed)
        completed = permissionWork.length
        await Promise.all(current)
      }
      const policies = { collections: { [collection]: rootPermissions }, globals: {} }
      const operands = { ...native, where: structuredClone(native.where ?? {}) }
      sanitizeWhereQuery({
        fields: config.flattenedFields,
        payload: scopedReq.payload,
        where: operands.where,
      })
      await validateQueryPaths({
        collectionConfig: config,
        overrideAccess,
        policies,
        req: scopedReq,
        where: operands.where,
      })
      operands.sort = sanitizeSortQuery({
        fields: config.flattenedFields,
        sort: operands.sort || config.defaultSort,
      })
      await validateSortQuery({
        collectionConfig: config,
        overrideAccess,
        policies,
        req: scopedReq,
        sort: operands.sort,
      })
      if (kind === 'find') {
        operands.joins = await sanitizeJoinQuery({
          collectionConfig: config,
          joins: operands.joins,
          overrideAccess,
          req: scopedReq,
        })
      }
      if (kind === 'distinct') {
        const field = getFieldByPath({
          config: scopedReq.payload.config,
          fields: config.flattenedFields,
          includeRelationships: true,
          path: originalField ?? operands.field!,
        })?.field
        if (!field) {
          throw new APIError(
            `Field ${operands.field} was not found in the collection ${collection}`,
          )
        }
        if (field.hidden && !showHiddenFields) {
          throw new Forbidden(scopedReq.t)
        }
        await validateQueryPaths({
          collectionConfig: config,
          overrideAccess,
          policies,
          req: scopedReq,
          showHiddenFields,
          where: { [originalField ?? operands.field!]: { exists: true } },
        })
      }
      const effectiveDepth = depth ?? (kind === 'find' ? scopedReq.payload.config.defaultDepth : 0)
      if (
        (effectiveDepth ?? 2) > 0 &&
        (kind === 'distinct' || hasPopulationFields({ fields: config.fields, req: scopedReq }))
      ) {
        throw new Error(
          'Authoritative automatic population requires the frozen public graph integration.',
        )
      }
      assertBranchReadBinding({ req: scopedReq })
      const originalPolicy = createBranchOriginalPolicy({
        branchID,
        collection,
        overrideAccess,
        req: scopedReq,
        where: typeof access === 'object' ? (access as Where) : {},
      })
      const args = {
        ...operands,
        ...(kind === 'find' ? { select: undefined } : {}),
        branchID,
        collection,
        originalPolicy,
        overrideAccess,
        req: scopedReq,
      }
      const result =
        global && materializedCollections.has(collection)
          ? await acquireMaterializedGlobal({ args, global, hasRootAuthority })
          : kind === 'count'
            ? await countBranchContent(args)
            : kind === 'distinct'
              ? await findDistinctBranchContent({ ...args, field: native.field! })
              : await queryBranchContent(args)
      if (
        kind === 'find' &&
        'docs' in result &&
        Array.isArray(result.docs) &&
        !materializedCollections.has(collection) &&
        sources[collection]?.config.custom?.branchStorage
      ) {
        for (const doc of result.docs) {
          const target = {
            collection: sources[collection]!.config.custom.branchStorage.heads,
            ...(global ? {} : { parentID: doc.id as number | string }),
          }
          const scopes = [
            { type: 'shared' as const },
            ...(scopedReq.payload.config.localization
              ? scopedReq.payload.config.localization.localeCodes.map((locale) => ({
                  type: 'locale' as const,
                  locale,
                }))
              : []),
          ]
          const readSet = await readBranchHeads({
            req: scopedReq,
            selections: scopes.flatMap((scope) => [
              { branchID: 'main', scope },
              { branchID, scope },
            ]),
            target,
          })
          await normalizeBranchOriginal({ branchID, doc, readSet, req: scopedReq, target })
          if (global) {
            const singleton = await scopedReq.payload.db.findGlobal({
              slug: global,
              locale: 'all',
              req: scopedReq,
              select: { id: true, globalType: true },
            })
            doc.id = singleton?.id
            if (singleton?.globalType) {
              doc.globalType = singleton.globalType
            } else {
              delete doc.globalType
            }
          }
        }
      }
      if (kind === 'find' && 'docs' in result && Array.isArray(result.docs) && native.select) {
        result.docs = result.docs.map((data) =>
          selectBranchQueryData({
            blocks: scopedReq.payload.config.blocks,
            data,
            fields: config.fields,
            select: native.select,
          }),
        )
      }
      return { accessResult: access, denied: false, result }
    },
    req,
  })
}

const acquireMaterializedGlobal = async ({
  args,
  global,
  hasRootAuthority,
}: {
  args: Parameters<typeof queryBranchContent>[0]
  global: string
  hasRootAuthority: boolean
}) => {
  const req = args.req
  const config = req.payload.globals.config.find(({ slug }) => slug === global)!
  const visibility = hasRootAuthority
    ? await readBranchIdentityVisibility({
        req,
        target: { collection: config.custom.branchStorage.heads },
      })
    : null
  if (
    hasRootAuthority &&
    (!visibility || !(visibility.isPublished || visibility.isLegacyDraftVisible))
  ) {
    return { docs: [] }
  }
  const originalAccess = consumeBranchOriginalPolicy({
    branchID: args.branchID,
    collection: args.collection,
    policy: args.originalPolicy,
    req,
  })
  const prepared = await prepareBranchContentQuery({ ...args, originalAccess })
  if (!prepared.query.findGlobal) {
    throw new Error('Authoritative global reads require the native singleton query compiler.')
  }
  const doc = await prepared.query.findGlobal({
    slug: global,
    context: prepared.context,
    locale: args.locale,
    req,
  })
  return { docs: doc && Object.keys(doc).length ? [doc] : [] }
}

/** Global authority is validated using its genuine config before the private query alias is used. */
export const resolveBranchGlobalRead = async ({
  global,
  ...args
}: { global: string } & Omit<Args, 'collection' | 'kind'>) => {
  if (!hasBranchReadCandidates({ req: args.req })) {
    if (
      getBranchReadIntent({ req: args.req }) !== undefined ||
      getSelectedBranch({ req: args.req }) !== undefined
    ) {
      throw new Error(
        'Selected branch reads require authoritative cutover and native snapshot support.',
      )
    }
    return null
  }
  return withBranchReadSnapshot({
    locale: args.native.locale,
    read: async ({ req }) => {
      const config = req.payload.globals.config.find(({ slug }) => slug === global)!
      if (
        config.versions?.drafts &&
        !config.custom?.branchQueryStorage &&
        (getBranchReadIntent({ req }) !== undefined || getSelectedBranch({ req }) !== undefined)
      ) {
        if (
          getBranchReadIntent({ req }) !== undefined ||
          getSelectedBranch({ req }) !== undefined
        ) {
          throw new Error(
            'Selected branch reads require authoritative cutover for the requested global.',
          )
        }
      }
      await readBranchCutover({ entity: config, req })
      const source = createBranchGlobalSourceRequest({ global, req })
      return resolveBranchCollectionRead({
        ...args,
        collection: source.sourceSlug,
        global,
        kind: 'find',
        legacyReq: args.req,
        req: source.scopedReq,
      })
    },
    req: args.req,
  })
}

/** A bounded schema walk, including registered block references; opaque JSON remains data. */
const hasPopulationFields = ({
  fields,
  req,
  seenBlocks = new Set<string>(),
}: {
  fields: Field[]
  req: PayloadRequest
  seenBlocks?: Set<string>
}): boolean =>
  fields.some((field) => {
    if (['join', 'relationship', 'richText', 'upload'].includes(field.type)) {
      return true
    }
    if (field.type === 'tabs') {
      return field.tabs.some((tab) => hasPopulationFields({ fields: tab.fields, req, seenBlocks }))
    }
    if ('fields' in field && hasPopulationFields({ fields: field.fields, req, seenBlocks })) {
      return true
    }
    if (field.type === 'blocks') {
      return field.blocks.some((block) => {
        if (typeof block !== 'string') {
          return hasPopulationFields({ fields: block.fields, req, seenBlocks })
        }
        if (seenBlocks.has(block)) {
          return false
        }
        seenBlocks.add(block)
        const definition = req.payload.config.blocks?.find((candidate) => candidate.slug === block)
        if (!definition) {
          throw new Error('A population block reference is not registered.')
        }
        return hasPopulationFields({ fields: definition.fields, req, seenBlocks })
      })
    }
    return false
  })

/** Only stored forward references encode projection keys; ordinary targets terminate this walk. */
const collectEncodedDependencies = ({
  fields,
  req,
  seenBlocks = new Set<string>(),
}: {
  fields: Field[]
  req: PayloadRequest
  seenBlocks?: Set<string>
}): string[] =>
  fields.flatMap((field) => {
    if (field.type === 'relationship' || field.type === 'upload') {
      return typeof field.relationTo === 'string' ? [field.relationTo] : field.relationTo
    }
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) =>
        collectEncodedDependencies({ fields: tab.fields, req, seenBlocks }),
      )
    }
    if ('fields' in field) {
      return collectEncodedDependencies({ fields: field.fields, req, seenBlocks })
    }
    if (field.type === 'blocks') {
      return field.blocks.flatMap((block) => {
        if (typeof block !== 'string') {
          return collectEncodedDependencies({ fields: block.fields, req, seenBlocks })
        }
        if (seenBlocks.has(block)) {
          return []
        }
        seenBlocks.add(block)
        const definition = req.payload.config.blocks?.find((candidate) => candidate.slug === block)
        if (!definition) {
          throw new Error('An encoding block reference is not registered.')
        }
        return collectEncodedDependencies({ fields: definition.fields, req, seenBlocks })
      })
    }
    return []
  })
