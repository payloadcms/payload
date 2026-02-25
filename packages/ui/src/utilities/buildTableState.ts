import type {
  BuildTableStateArgs,
  ClientCollectionConfig,
  ClientConfig,
  CollectionPreferences,
  Column,
  ErrorResult,
  PaginatedDocs,
  SanitizedCollectionConfig,
  ServerFunction,
  Where,
} from 'payload'

import { APIError, canAccessAdmin, formatErrors } from 'payload'
import { applyLocaleFiltering, isNumber } from 'payload/shared'

import { getClientConfig } from './getClientConfig.js'
import { getColumns } from './getColumns.js'
import { renderFilters, renderTable } from './renderTable.js'
import { upsertPreferences } from './upsertPreferences.js'

type BuildTableStateSuccessResult = {
  clientConfig?: ClientConfig
  data: PaginatedDocs
  errors?: never
  preferences: CollectionPreferences
  renderedFilters: Map<string, React.ReactNode>
  state: Column[]
  Table: React.ReactNode
}

type BuildTableStateErrorResult = {
  data?: any
  renderedFilters?: never
  state?: never
  Table?: never
} & (
  | {
      message: string
    }
  | ErrorResult
)

export type BuildTableStateResult = BuildTableStateErrorResult | BuildTableStateSuccessResult

export const buildTableStateHandler: ServerFunction<
  BuildTableStateArgs,
  Promise<BuildTableStateResult>
> = async (args) => {
  const { req } = args

  try {
    const res = await buildTableState(args)
    return res
  } catch (err) {
    req.payload.logger.error({ err, msg: `There was an error building form state` })

    if (err.message === 'Could not find field schema for given path') {
      return {
        message: err.message,
      }
    }

    if (err.message === 'Unauthorized') {
      return null
    }

    return formatErrors(err)
  }
}

const buildTableState: ServerFunction<
  BuildTableStateArgs,
  Promise<BuildTableStateSuccessResult>
> = async (args) => {
  const {
    collectionSlug,
    columns: columnsFromArgs,
    data: dataFromArgs,
    enableRowSelections,
    orderableFieldName,
    parent,
    permissions,
    query,
    renderRowTypes,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
    tableAppearance,
  } = args

  await canAccessAdmin({ req })

  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap: payload.importMap,
    user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  let collectionConfig: SanitizedCollectionConfig
  let clientCollectionConfig: ClientCollectionConfig

  if (!Array.isArray(collectionSlug)) {
    if (req.payload.collections[collectionSlug]) {
      collectionConfig = req.payload.collections[collectionSlug].config
      clientCollectionConfig = clientConfig.collections.find(
        (collection) => collection.slug === collectionSlug,
      )
    }
  }

  const collectionPreferences = await upsertPreferences<CollectionPreferences>({
    key: Array.isArray(collectionSlug)
      ? `${parent.collectionSlug}-${parent.joinPath}`
      : `collection-${collectionSlug}`,
    req,
    value: {
      columns: columnsFromArgs,
      limit: isNumber(query?.limit) ? Number(query.limit) : undefined,
      sort: query?.sort as string,
    },
  })

  let data: PaginatedDocs = dataFromArgs

  // lookup docs, if desired, i.e. within `join` field which initialize with `depth: 0`

  if (!data?.docs || query) {
    if (Array.isArray(collectionSlug)) {
      if (!parent) {
        throw new APIError('Unexpected array of collectionSlug, parent must be provided')
      }

      const select = {}
      let currentSelectRef = select

      const segments = parent.joinPath.split('.')

      for (let i = 0; i < segments.length; i++) {
        currentSelectRef[segments[i]] = i === segments.length - 1 ? true : {}
        currentSelectRef = currentSelectRef[segments[i]]
      }

      const joinQuery: { limit?: number; page?: number; sort?: string; where?: Where } = {
        sort: query?.sort as string,
        where: query?.where,
      }

      if (query) {
        if (!Number.isNaN(Number(query.limit))) {
          joinQuery.limit = Number(query.limit)
        }

        if (!Number.isNaN(Number(query.page))) {
          joinQuery.limit = Number(query.limit)
        }
      }

      let parentDoc = await payload.findByID({
        id: parent.id,
        collection: parent.collectionSlug,
        depth: 1,
        joins: {
          [parent.joinPath]: joinQuery,
        },
        overrideAccess: false,
        select,
        user: req.user,
      })

      for (let i = 0; i < segments.length; i++) {
        if (i === segments.length - 1) {
          data = parentDoc[segments[i]]
        } else {
          parentDoc = parentDoc[segments[i]]
        }
      }
    } else {
      data = await payload.find({
        collection: collectionSlug,
        depth: 0,
        draft: true,
        limit: query?.limit,
        locale: req.locale,
        overrideAccess: false,
        page: query?.page,
        sort: query?.sort,
        user: req.user,
        where: query?.where,
      })
    }
  }

  const { columnState, Table } = renderTable({
    clientCollectionConfig,
    clientConfig,
    collectionConfig,
    collections: Array.isArray(collectionSlug) ? collectionSlug : undefined,
    columns: getColumns({
      clientConfig,
      collectionConfig: clientCollectionConfig,
      collectionSlug,
      columns: columnsFromArgs,
      i18n: req.i18n,
      permissions,
    }),
    data,
    enableRowSelections,
    fieldPermissions: Array.isArray(collectionSlug)
      ? true
      : permissions.collections[collectionSlug].fields,
    i18n: req.i18n,
    orderableFieldName,
    payload,
    query,
    renderRowTypes,
    req,
    tableAppearance,
    useAsTitle: Array.isArray(collectionSlug)
      ? payload.collections[collectionSlug[0]]?.config?.admin?.useAsTitle
      : collectionConfig?.admin?.useAsTitle,
  })

  let renderedFilters

  if (collectionConfig) {
    renderedFilters = renderFilters(collectionConfig.fields, req.payload.importMap)
  }

  return {
    data,
    preferences: collectionPreferences,
    renderedFilters,
    state: columnState,
    Table,
  }
}
