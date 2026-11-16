import type {
  BuildTableStateArgs,
  ClientCollectionConfig,
  ClientConfig,
  CollectionPreferences,
  Column,
  ErrorResult,
  NestedDocRow,
  PaginatedDocs,
  SanitizedCollectionConfig,
  ServerFunction,
  Where,
} from 'payload'

import { APIError, canAccessAdmin, formatErrors, getNestedDocsBranch } from 'payload'
import { appendDateTimezoneSelectFields, applyLocaleFiltering, isNumber } from 'payload/shared'

import { enrichDocsWithVersionStatus } from '../views/List/enrichDocsWithVersionStatus.js'
import { transformColumnsToSelect } from '../views/List/transformColumnsToSelect.js'
import { getClientConfig } from './getClientConfig.js'
import { getColumns } from './getColumns.js'
import { getDocumentThumbnailSelect } from './getDocumentThumbnailSelect.js'
import { renderFilters, renderTable } from './renderTable.js'
import { upsertPreferences } from './upsertPreferences.js'

type BuildTableStateSuccessResult = {
  clientConfig?: ClientConfig
  data: PaginatedDocs
  errors?: never
  nestedDocRows?: Record<string, NestedDocRow>
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
    nestedDocs,
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

  const preferencesKey = parent
    ? `${parent.collectionSlug}-${parent.joinPath}`
    : `collection-${collectionSlug}`

  const collectionPreferences = await upsertPreferences<CollectionPreferences>({
    key: preferencesKey,
    req,
    value: {
      columns: columnsFromArgs,
      limit: isNumber(query?.limit) ? Number(query.limit) : undefined,
      sort: query?.sort as string,
    },
  })

  let data: PaginatedDocs = dataFromArgs
  let nestedDocRows: Record<string, NestedDocRow> | undefined
  const columns = getColumns({
    clientConfig,
    collectionConfig: clientCollectionConfig,
    collectionSlug,
    columns: columnsFromArgs,
    i18n: req.i18n,
    permissions,
  })

  if (nestedDocs) {
    if (!collectionConfig?.nestedDocs) {
      throw new APIError('Collection does not support nested documents', 400)
    }

    const select = getDocumentThumbnailSelect({
      collectionConfig,
      select: transformColumnsToSelect(columns),
    })

    if (collectionConfig.admin.useAsTitle) {
      select[collectionConfig.admin.useAsTitle] = true
    }
    select.updatedAt = true
    if (collectionConfig.versions?.drafts) {
      select._status = true
    }
    appendDateTimezoneSelectFields({ fields: collectionConfig.flattenedFields, select })

    const branch = await getNestedDocsBranch({
      collectionConfig,
      parentID: nestedDocs.parentID,
      query,
      req,
      select,
    })
    nestedDocRows = branch.rows
    data = await enrichDocsWithVersionStatus({ collectionConfig, data: branch.data, req })
  }

  // lookup docs, if desired, i.e. within `join` field which initialize with `depth: 0`

  if (!nestedDocs && (!data?.docs || query)) {
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
    columns,
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
    viewType: nestedDocs ? 'list' : undefined,
  })

  let renderedFilters

  if (collectionConfig) {
    renderedFilters = nestedDocs
      ? new Map()
      : renderFilters(collectionConfig.fields, req.payload.importMap)
  }

  return {
    data,
    nestedDocRows,
    preferences: collectionPreferences,
    renderedFilters,
    state: columnState,
    Table: nestedDocs ? null : Table,
  }
}
