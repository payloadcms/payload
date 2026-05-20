import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientConfig,
  CollectionPreferences,
  ColumnPreference,
  ComponentRenderer,
  CustomComponent,
  EntityDescriptionComponent,
  ImportMap,
  ListQuery,
  ListViewClientProps,
  PaginatedDocs,
  Payload,
  QueryPreset,
  ResolvedFilterOptions,
  SanitizedCollectionPermission,
  SanitizedFieldsPermissions,
  SanitizedPermissions,
  ViewTypes,
} from 'payload'

import type {
  renderFilters as RenderFiltersFn,
  renderTable as RenderTableFn,
} from '../../utilities/renderTable.js'

import { RenderClientComponent } from '../../elements/RenderServerComponent/clientOnly.js'
import { renderListViewSlots } from './renderListViewSlots.js'

/**
 * Serializable PayloadComponent references for list view admin components.
 * These are strings or plain objects ({path, exportName, clientProps, serverProps})
 * that can cross a JSON boundary and be resolved via importMap on the client.
 */
export type SerializableListComponents = {
  afterList?: CustomComponent[]
  afterListTable?: CustomComponent[]
  beforeList?: CustomComponent[]
  beforeListTable?: CustomComponent[]
  Description?: EntityDescriptionComponent
  listMenuItems?: CustomComponent[]
}

export type SerializableListViewData = {
  /**
   * Optional collection config override for collections not in the client config
   * (e.g. hidden collections like `payload-query-presets`).
   * When provided, `buildListViewClientProps` uses this instead of looking up
   * the collection in `clientConfig.collections`.
   */
  collectionConfigOverride?: {
    admin: Record<string, any>
    fields: Record<string, any>[]
    slug: string
  }
  collectionPreferences: CollectionPreferences
  collectionSlug: string
  columns: ColumnPreference[]
  components?: SerializableListComponents
  customCellProps?: Record<string, any>
  data: PaginatedDocs
  description?: string
  disableBulkDelete?: boolean
  disableBulkEdit: boolean
  disableQueryPresets?: boolean
  enableRowSelections: boolean
  fieldPermissions?: SanitizedFieldsPermissions
  groupedData?: {
    data: PaginatedDocs
    groupByValue: string
    heading: string
  }[]
  hasCreatePermission: boolean
  hasDeletePermission: boolean
  hasTrashPermission: boolean
  isInDrawer: boolean
  newDocumentURL: string
  notFoundDocId?: null | string
  orderableFieldName?: string
  query: ListQuery
  queryPreset?: QueryPreset
  queryPresetPermissions?: SanitizedCollectionPermission
  resolvedFilterOptions: Map<string, ResolvedFilterOptions>
  useAsTitle?: string
  viewType: ViewTypes
}

export type BuildListViewClientPropsArgs = {
  clientConfig: ClientConfig
  data: SerializableListViewData
  i18n: I18nClient
  importMap: ImportMap
  permissions?: SanitizedPermissions
  renderComponent?: ComponentRenderer
  renderFilters: typeof RenderFiltersFn
  renderTable: typeof RenderTableFn
}

/**
 * Reconstruct `ListViewClientProps` (including React nodes for Table, columns, filters)
 * from serializable data using `RenderClientComponent`.
 *
 * Designed for non-RSC frameworks (e.g. TanStack Start) where data crosses a
 * JSON serialization boundary and React nodes must be rebuilt on the client.
 *
 * List view slots (beforeList, afterList, etc.) are resolved from serialized
 * PayloadComponent references via the client importMap.
 */
export function buildListViewClientProps({
  clientConfig,
  data: listData,
  i18n,
  importMap,
  permissions,
  renderComponent,
  renderFilters,
  renderTable,
}: BuildListViewClientPropsArgs): ListViewClientProps {
  const render = renderComponent || RenderClientComponent

  const baseClientCollectionConfig = clientConfig.collections.find(
    (c) => c.slug === listData.collectionSlug,
  )
  const collectionConfigOverride = listData.collectionConfigOverride as
    | (typeof clientConfig.collections)[number]
    | undefined
  const mergedFields = (() => {
    const baseFields = baseClientCollectionConfig?.fields
    const overrideFields = collectionConfigOverride?.fields

    if (!baseFields) {
      return overrideFields ?? []
    }

    if (!overrideFields?.length) {
      return baseFields
    }

    return baseFields.map((field) => {
      if ('name' in field && field.type === 'richText') {
        const overrideField = overrideFields.find(
          (of: any) => of.name === field.name && of.type === 'richText',
        ) as Record<string, any> | undefined

        if (overrideField?.editor) {
          return { ...field, editor: overrideField.editor } as typeof field
        }
      }
      return field
    })
  })()

  const clientCollectionConfig = collectionConfigOverride
    ? ({
        ...(baseClientCollectionConfig ?? {
          slug: listData.collectionSlug,
          admin: {},
          fields: [],
        }),
        ...collectionConfigOverride,
        admin: {
          ...(baseClientCollectionConfig?.admin ?? {}),
          ...(collectionConfigOverride.admin ?? {}),
        },
        // Prefer the base client config fields: they carry the full client field
        // structure (hasMany, required, minLength, etc.) that field components
        // like TextFieldComponent destructure. The override's fields are a
        // lossy serializable projection and only used as a fallback when no
        // base client config exists (e.g. custom/non-registered collections).
        // For richText fields, the serialized `editor` from the override is
        // merged back so that `renderCell` can access CellComponent / DiffComponent.
        fields: mergedFields,
      } as (typeof clientConfig.collections)[number])
    : baseClientCollectionConfig

  const payloadProxy = {
    collections: {
      [listData.collectionSlug]: {
        config: clientCollectionConfig ?? {
          slug: listData.collectionSlug,
          // The payload proxy's collection config is consumed by cell
          // renderers and list-view helpers that read admin.hidden,
          // admin.useAsTitle, admin.components, etc. Without these defaults
          // destructuring like `const { admin: { hidden } } = config` would
          // crash when an unknown collection slug is rendered.
          admin: { components: {}, hidden: false, useAsTitle: 'id' },
          fields: [],
        },
      },
    },
    config: { routes: { admin: clientConfig.routes?.admin ?? '/admin' } },
    importMap,
  } as unknown as Payload
  const collectionConfig = payloadProxy.collections[listData.collectionSlug]?.config

  const fieldPermissions =
    listData.fieldPermissions ?? permissions?.collections?.[listData.collectionSlug]?.fields

  let columnState
  let Table

  if (listData.query?.groupBy && listData.groupedData?.length) {
    const groupByFieldPath = listData.query.groupBy.replace(/^-/, '')
    const groupedTables = listData.groupedData.map((group, index) =>
      renderTable({
        clientCollectionConfig,
        collectionConfig,
        columns: listData.columns,
        customCellProps: listData.customCellProps,
        data: group.data,
        enableRowSelections: listData.enableRowSelections,
        fieldPermissions,
        groupByFieldPath,
        groupByValue: group.groupByValue,
        heading: group.heading,
        i18n,
        key: `table-${group.groupByValue}-${index}`,
        orderableFieldName: listData.orderableFieldName,
        payload: payloadProxy,
        query: listData.query,
        renderComponent: render,
        useAsTitle: listData.useAsTitle,
        viewType: listData.viewType,
      }),
    )

    columnState = groupedTables[0]?.columnState || []
    Table = groupedTables.map((group) => group.Table)
  } else {
    const renderedTable = renderTable({
      clientCollectionConfig,
      collectionConfig,
      columns: listData.columns,
      customCellProps: listData.customCellProps,
      data: listData.data,
      enableRowSelections: listData.enableRowSelections,
      fieldPermissions,
      i18n,
      orderableFieldName: listData.orderableFieldName,
      payload: payloadProxy,
      query: listData.query,
      renderComponent: render,
      useAsTitle: listData.useAsTitle,
      viewType: listData.viewType,
    })

    columnState = renderedTable.columnState
    Table = renderedTable.Table
  }

  const renderedFilters = renderFilters(collectionConfig?.fields || [], importMap, render)

  const slotClientProps = {
    collectionSlug: listData.collectionSlug,
    hasCreatePermission: listData.hasCreatePermission,
    hasDeletePermission: listData.hasDeletePermission,
    hasTrashPermission: listData.hasTrashPermission,
    newDocumentURL: listData.newDocumentURL,
  }

  const slots = renderListViewSlots({
    clientProps: slotClientProps,
    collectionConfig: {
      slug: listData.collectionSlug,
      admin: { components: listData.components ?? {} },
    } as any,
    description: listData.description,
    notFoundDocId: listData.notFoundDocId,
    payload: payloadProxy,
    renderComponent: render,
    serverProps: { i18n } as any,
  })

  return {
    ...slots,
    collectionSlug: listData.collectionSlug,
    columnState,
    disableBulkDelete: listData.disableBulkDelete,
    disableBulkEdit: listData.disableBulkEdit,
    disableQueryPresets: listData.disableQueryPresets,
    enableRowSelections: listData.enableRowSelections,
    hasCreatePermission: listData.hasCreatePermission,
    hasDeletePermission: listData.hasDeletePermission,
    hasTrashPermission: listData.hasTrashPermission,
    listPreferences: listData.collectionPreferences,
    newDocumentURL: listData.newDocumentURL,
    queryPreset: listData.queryPreset,
    queryPresetPermissions: listData.queryPresetPermissions,
    renderedFilters,
    resolvedFilterOptions: listData.resolvedFilterOptions,
    Table,
    viewType: listData.viewType,
  }
}
