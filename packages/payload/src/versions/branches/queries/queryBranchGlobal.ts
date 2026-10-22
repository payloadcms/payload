import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest, Where } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'
import type { BranchQueryStorage } from './registerBranchQueryStorage.js'

import { createBranchReadRequest } from '../../../utilities/createBranchReadRequest.js'
import { queryBranchContentGraph } from './queryBranchContentGraph.js'

/** A global uses its native singleton content; no public document identity is invented. */
export const queryBranchGlobalGraph = async ({
  branchID,
  depth = 0,
  global,
  locale,
  overrideAccess = false,
  req,
  where,
}: {
  branchID: BranchHeadID
  depth?: number
  global: string
  locale?: string
  overrideAccess?: boolean
  req: PayloadRequest
  where?: Where
}) => {
  const { scopedReq, sourceSlug } = createBranchGlobalSourceRequest({ global, req })
  const result = await queryBranchContentGraph({
    branchID,
    collection: sourceSlug,
    depth,
    joins: false,
    limit: 1,
    locale,
    overrideAccess,
    req: scopedReq,
    sort: 'id',
    where,
  })
  return { graph: result.graph, result: result.result.docs[0] ?? null }
}

/** A raw singleton read; population callers use the same-snapshot global graph entrypoint. */
export const queryBranchGlobal = async (
  args: Parameters<typeof queryBranchGlobalGraph>[0],
): Promise<null | Record<string, unknown>> => (await queryBranchGlobalGraph(args)).result

/** Shared singleton alias for trusted original-operation reads and ordinary raw graphs. */
export const createBranchGlobalSourceRequest = ({
  global,
  req,
}: {
  global: string
  req: PayloadRequest
}) => {
  const config = req.payload.globals.config.find(({ slug }) => slug === global)
  const storage = config?.custom?.branchQueryStorage as BranchQueryStorage | undefined

  if (!config || !storage) {
    throw new Error('The requested global has no branch query relation.')
  }
  let sourceSlug = `__branch_global_source_${global}`
  while (Object.hasOwn(req.payload.collections, sourceSlug)) {
    sourceSlug += '_'
  }
  const source = {
    ...req.payload.collections[storage.projection]!.config,
    slug: sourceSlug,
    access: {
      ...req.payload.collections[storage.projection]!.config.access,
      ...config.access,
      read: (args) =>
        config.access.read ? config.access.read({ ...args, slug: global }) : Boolean(args.req.user),
    },
    custom: { ...config.custom, branchQueryGlobalSource: global },
    fields: config.fields,
    flattenedFields: config.flattenedFields,
  } as SanitizedCollectionConfig
  const scopedReq = createBranchReadRequest({
    payload: Object.create(req.payload, {
      collections: {
        configurable: true,
        enumerable: true,
        value: { ...req.payload.collections, [sourceSlug]: { config: source } },
        writable: true,
      },
    }),
    req,
  })
  return { scopedReq, sourceSlug }
}
