import type {
  BuildTableStateArgs,
  ClientCollectionConfig,
  ClientConfig,
  CollectionPreferences,
  Column,
  ColumnPreference,
  ComponentRenderer,
  ErrorResult,
  ListQuery,
  PaginatedDocs,
  SanitizedCollectionConfig,
  SanitizedFieldsPermissions,
  ServerFunction,
  Where,
} from 'payload'

import { APIError, canAccessAdmin, formatErrors } from 'payload'
import { applyLocaleFiltering, isNumber } from 'payload/shared'

import { RenderClientComponent } from '../elements/RenderServerComponent/clientOnly.js'
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
  tableStateData?: never
}

/**
 * Serializable subset of `renderTable` props used by the data-only branch.
 *
 * Non-RSC adapters (e.g. TanStack Start) serialize server function results to
 * JSON, which drops React elements (e.g. the rendered `Table`) and the rich
 * `Column[]` state (rendered cells / Heading nodes). Callers that receive this
 * payload reconstruct the table on the client via `buildTableStateClientProps`.
 */
export type SerializableTableStateData = {
  collectionSlug: string | string[]
  columns: ColumnPreference[]
  customCellProps?: Record<string, unknown>
  data: PaginatedDocs
  enableRowSelections: boolean
  fieldPermissions?: SanitizedFieldsPermissions | true
  orderableFieldName?: string
  query?: ListQuery
  renderRowTypes?: boolean
  tableAppearance?: 'condensed' | 'default'
  useAsTitle?: string
}

type BuildTableStateDataOnlyResult = {
  data: PaginatedDocs
  errors?: never
  preferences: CollectionPreferences
  renderedFilters?: never
  state?: never
  Table?: never
  tableStateData: SerializableTableStateData
}

type BuildTableStateErrorResult = {
  data?: any
  renderedFilters?: never
  state?: never
  Table?: never
  tableStateData?: never
} & (
  | {
      message: string
    }
  | ErrorResult
)

export type BuildTableStateResult =
  | BuildTableStateDataOnlyResult
  | BuildTableStateErrorResult
  | BuildTableStateSuccessResult

export const buildTableStateHandler: ServerFunction<
  BuildTableStateArgs,
  Promise<BuildTableStateResult>
> = async (args) => {
  const { renderComponent, req } = args

  try {
    const res = await buildTableState(args, renderComponent || RenderClientComponent)
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

const buildTableState = async (
  args: Parameters<ServerFunction<BuildTableStateArgs>>[0],
  renderComponent: ComponentRenderer,
): Promise<BuildTableStateDataOnlyResult | BuildTableStateSuccessResult> => {
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

  const resolvedColumns = getColumns({
    clientConfig,
    collectionConfig: clientCollectionConfig,
    collectionSlug,
    columns: columnsFromArgs,
    i18n: req.i18n,
    permissions,
  })

  const resolvedFieldPermissions = Array.isArray(collectionSlug)
    ? true
    : permissions.collections[collectionSlug].fields

  const resolvedUseAsTitle = Array.isArray(collectionSlug)
    ? payload.collections[collectionSlug[0]]?.config?.admin?.useAsTitle
    : collectionConfig?.admin?.useAsTitle

  // Data-only mode (non-RSC adapters): skip React rendering. The caller
  // serializes the result and the client reconstructs `{state, Table}` via
  // `buildTableStateClientProps` once the result lands in the browser.
  if (args.mode === 'data-only') {
    return {
      data,
      preferences: collectionPreferences,
      tableStateData: {
        collectionSlug,
        columns: resolvedColumns,
        data,
        enableRowSelections,
        fieldPermissions: resolvedFieldPermissions,
        orderableFieldName,
        query,
        renderRowTypes,
        tableAppearance,
        useAsTitle: resolvedUseAsTitle,
      },
    }
  }

  const { columnState, Table } = renderTable({
    clientCollectionConfig,
    clientConfig,
    collectionConfig,
    collections: Array.isArray(collectionSlug) ? collectionSlug : undefined,
    columns: resolvedColumns,
    data,
    enableRowSelections,
    fieldPermissions: resolvedFieldPermissions,
    i18n: req.i18n,
    orderableFieldName,
    payload,
    query,
    renderComponent,
    renderRowTypes,
    req,
    tableAppearance,
    useAsTitle: resolvedUseAsTitle,
  })

  let renderedFilters

  if (collectionConfig) {
    renderedFilters = renderFilters(collectionConfig.fields, req.payload.importMap, renderComponent)
  }

  return {
    data,
    preferences: collectionPreferences,
    renderedFilters,
    state: columnState,
    Table,
  }
}
