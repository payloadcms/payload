import { status as httpStatus } from 'http-status'

import type { FindOptions } from '../../index.js'
import type { PayloadRequest, PopulateType, SelectType } from '../../types/index.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { Collection, TypeWithID } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { getSelectMode } from '../../utilities/getSelectMode.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import {
  isInheritedReadVersionsAccess,
  withInheritedReadVersionsParentID,
} from '../../versions/isInheritedReadVersionsAccess.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

export type Arguments = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  id: number | string
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  showHiddenFields?: boolean
  trash?: boolean
} & Pick<FindOptions<string, SelectType>, 'select'>

const prefetchVersionForInheritedReadAccess = async <TData extends TypeWithID>({
  id,
  collectionConfig,
  locale,
  req,
  select,
  trash,
}: {
  collectionConfig: Collection['config']
  id: number | string
  locale: string
  req: PayloadRequest
  select?: SelectType
  trash: boolean
}): Promise<{
  parentID?: TypeWithVersion<TData>['parent']
  version?: TypeWithVersion<TData>
}> => {
  const selectMode = select ? getSelectMode(select) : undefined
  const shouldOmitParent = Boolean(
    select && ((selectMode === 'include' && select.parent !== true) || select.parent === false),
  )
  let prefetchSelect = select

  if (select && selectMode === 'include') {
    prefetchSelect = { ...select, parent: true }
  } else if (select?.parent === false) {
    prefetchSelect = { ...select }
    delete prefetchSelect.parent
  }

  const { docs } = await req.payload.db.findVersions<TData>({
    collection: collectionConfig.slug,
    limit: 1,
    locale,
    pagination: false,
    req,
    select: prefetchSelect,
    where: appendNonTrashedFilter({
      deletedAtPath: 'version.deletedAt',
      enableTrash: collectionConfig.trash,
      trash,
      where: { id: { equals: id } },
    }),
  })
  const version = docs[0]
  const parentID = version?.parent

  if (version && shouldOmitParent) {
    const versionWithoutParent = { ...version }
    delete (versionWithoutParent as Partial<TypeWithVersion<TData>>).parent

    return { parentID, version: versionWithoutParent }
  }

  return { parentID, version }
}

export const findVersionByIDOperation = async <TData extends TypeWithID = any>(
  args: Arguments,
): Promise<TypeWithVersion<TData>> => {
  const {
    id,
    collection: { config: collectionConfig },
    currentDepth,
    depth,
    disableErrors,
    overrideAccess,
    populate,
    req: { fallbackLocale, locale, payload },
    req,
    select: incomingSelect,
    showHiddenFields,
    trash = false,
  } = args

  if (!id) {
    throw new APIError('Missing ID of version.', httpStatus.BAD_REQUEST)
  }

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  args = await buildBeforeOperation({
    args,
    collection: collectionConfig,
    operation: 'findVersionByID',
    overrideAccess,
  })

  const where = { id: { equals: id } }
  const select = sanitizeSelect({
    fields: buildVersionCollectionFields(payload.config, collectionConfig, true),
    select: resolveSelect({
      config: collectionConfig.select,
      operation: 'read',
      req,
      select: incomingSelect,
    }),
    versions: true,
  })

  const inheritsReadAccess = isInheritedReadVersionsAccess(collectionConfig.access.readVersions)
  const shouldPrefetchVersion = !overrideAccess && inheritsReadAccess
  const prefetched = shouldPrefetchVersion
    ? await prefetchVersionForInheritedReadAccess<TData>({
        id,
        collectionConfig,
        locale: locale!,
        req,
        select,
        trash,
      })
    : undefined

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess
    ? await executeAccess(
        {
          id,
          slug: collectionConfig.slug,
          disableErrors,
          req,
        },
        inheritsReadAccess
          ? (accessArgs) =>
              collectionConfig.access.readVersions(
                withInheritedReadVersionsParentID(accessArgs, prefetched?.parentID),
              )
          : collectionConfig.access.readVersions,
      )
    : true

  // If errors are disabled, and access returns false, return null
  if (accessResults === false) {
    return null!
  }

  const hasWhereAccess = typeof accessResults === 'object'

  let fullWhere = combineQueries(where, accessResults)

  fullWhere = appendNonTrashedFilter({
    deletedAtPath: 'version.deletedAt',
    enableTrash: collectionConfig.trash,
    trash,
    where: fullWhere,
  })

  // /////////////////////////////////////
  // Find by ID
  // /////////////////////////////////////

  let result = prefetched?.version as TypeWithVersion<TData>

  if (!shouldPrefetchVersion || hasWhereAccess) {
    const versionsQuery = await payload.db.findVersions<TData>({
      collection: collectionConfig.slug,
      limit: 1,
      locale: locale!,
      pagination: false,
      req,
      select,
      where: fullWhere,
    })

    result = versionsQuery.docs[0]!
  }

  if (!result) {
    if (!disableErrors) {
      if (!hasWhereAccess) {
        throw new NotFound(req.t)
      }
      if (hasWhereAccess) {
        throw new Forbidden(req.t)
      }
    }

    return null!
  }

  if (!result.version) {
    // Fallback if not selected
    ;(result as any).version = {}
  }

  // /////////////////////////////////////
  // beforeRead - Collection
  // /////////////////////////////////////

  if (collectionConfig.hooks?.beforeRead?.length) {
    for (const hook of collectionConfig.hooks.beforeRead) {
      result.version =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          doc: result.version,
          overrideAccess,
          query: fullWhere,
          req,
        })) || result.version
    }
  }

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result.version = await afterRead({
    collection: collectionConfig,
    context: req.context,
    currentDepth,
    depth: depth!,
    doc: result.version,
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    draft: undefined,
    fallbackLocale: fallbackLocale!,
    global: null,
    locale: locale!,
    overrideAccess: overrideAccess!,
    populate,
    req,
    select: typeof select?.version === 'object' ? select.version : undefined,
    showHiddenFields: showHiddenFields!,
  })

  // /////////////////////////////////////
  // afterRead - Collection
  // /////////////////////////////////////

  if (collectionConfig.hooks?.afterRead?.length) {
    for (const hook of collectionConfig.hooks.afterRead) {
      result.version =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          doc: result.version,
          overrideAccess,
          query: fullWhere,
          req,
        })) || result.version
    }
  }

  // /////////////////////////////////////
  // afterOperation - Collection
  // /////////////////////////////////////

  result = await buildAfterOperation({
    args,
    collection: collectionConfig,
    operation: 'findVersionByID',
    overrideAccess,
    result,
  })

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result
}
