import type { TFunction } from '@payloadcms/translations'
import type { Field, SanitizedCollectionConfig, SanitizedFieldsPermissions } from 'payload'

import type {
  SerializableListComponents,
  SerializableListViewData,
} from './buildListViewClientProps.js'
import type { ListViewData } from './getListViewData.js'

export type ToSerializableListViewDataArgs = {
  collectionConfig: SanitizedCollectionConfig
  fieldPermissions?: SanitizedFieldsPermissions
  listViewData: ListViewData
  t?: TFunction
}

/**
 * Strips a field down to only the properties needed for column rendering,
 * removing non-serializable values like functions (validate, access, hooks, condition, etc.).
 */
function toSerializableField(field: Field): Record<string, any> {
  const serializable: Record<string, any> = {
    name: 'name' in field ? field.name : undefined,
    type: field.type,
  }

  if ('label' in field && field.label) {
    serializable.label = field.label
  }

  if ('labels' in field && field.labels) {
    serializable.labels = field.labels
  }

  if ('virtual' in field && field.virtual) {
    serializable.virtual = field.virtual
  }

  if (
    field.type === 'richText' &&
    'editor' in field &&
    field.editor &&
    typeof field.editor !== 'function'
  ) {
    serializable.editor = {}

    if ('CellComponent' in field.editor) {
      serializable.editor.CellComponent = field.editor.CellComponent
    }

    if ('DiffComponent' in field.editor) {
      serializable.editor.DiffComponent = field.editor.DiffComponent
    }
  }

  if (field.admin) {
    serializable.admin = {}

    if ('hidden' in field.admin && field.admin.hidden) {
      serializable.admin.hidden = field.admin.hidden
    }

    if ('disabled' in field.admin && field.admin.disabled) {
      serializable.admin.disabled = field.admin.disabled
    }

    if ('disableListColumn' in field.admin && field.admin.disableListColumn) {
      serializable.admin.disableListColumn = field.admin.disableListColumn
    }

    if ('components' in field.admin && field.admin.components) {
      const components: Record<string, any> = {}

      if ('Cell' in field.admin.components && field.admin.components.Cell) {
        components.Cell = field.admin.components.Cell
      }

      if ('Label' in field.admin.components && field.admin.components.Label) {
        components.Label = field.admin.components.Label
      }

      if (Object.keys(components).length > 0) {
        serializable.admin.components = components
      }
    }

    if (Object.keys(serializable.admin).length === 0) {
      delete serializable.admin
    }
  }

  if ('fields' in field && Array.isArray(field.fields)) {
    serializable.fields = field.fields.map(toSerializableField)
  }

  if ('blocks' in field && Array.isArray(field.blocks)) {
    serializable.blocks = field.blocks.map((block: any) =>
      typeof block === 'string'
        ? block
        : {
            slug: block.slug,
            labels: block.labels,
          },
    )
  }

  if ('blockReferences' in field && Array.isArray(field.blockReferences)) {
    serializable.blockReferences = field.blockReferences.map((block: any) =>
      typeof block === 'string'
        ? block
        : {
            slug: block.slug,
            labels: block.labels,
          },
    )
  }

  if ('tabs' in field && Array.isArray(field.tabs)) {
    serializable.tabs = field.tabs.map((tab: any) => ({
      ...('name' in tab ? { name: tab.name } : {}),
      ...('label' in tab ? { label: tab.label } : {}),
      fields: tab.fields?.map(toSerializableField) ?? [],
    }))
  }

  return serializable
}

/**
 * Converts `ListViewData` (server-side, contains React nodes and non-serializable references)
 * into `SerializableListViewData` (JSON-safe, can cross serialization boundaries).
 *
 * Used by both the TanStack Root page loader and the data-only render-list handler
 * so the conversion logic lives in one place.
 */
export function toSerializableListViewData({
  collectionConfig,
  fieldPermissions,
  listViewData,
  t,
}: ToSerializableListViewDataArgs): SerializableListViewData {
  const rawDescription =
    typeof collectionConfig.admin.description === 'function'
      ? t
        ? collectionConfig.admin.description({ t })
        : undefined
      : collectionConfig.admin.description
  const staticDescription = typeof rawDescription === 'string' ? rawDescription : undefined

  const adminComponents = collectionConfig.admin?.components
  const serializableComponents: SerializableListComponents | undefined = adminComponents
    ? {
        ...(adminComponents.afterList ? { afterList: adminComponents.afterList } : {}),
        ...(adminComponents.afterListTable
          ? { afterListTable: adminComponents.afterListTable }
          : {}),
        ...(adminComponents.beforeList ? { beforeList: adminComponents.beforeList } : {}),
        ...(adminComponents.beforeListTable
          ? { beforeListTable: adminComponents.beforeListTable }
          : {}),
        ...(adminComponents.Description ? { Description: adminComponents.Description } : {}),
        ...(adminComponents.listMenuItems ? { listMenuItems: adminComponents.listMenuItems } : {}),
      }
    : undefined

  const collectionConfigOverride = {
    slug: collectionConfig.slug,
    admin: {
      defaultColumns: collectionConfig.admin?.defaultColumns,
      useAsTitle: collectionConfig.admin?.useAsTitle,
    },
    fields: collectionConfig.fields.map(toSerializableField),
  }

  return {
    collectionConfigOverride,
    collectionPreferences: listViewData.collectionPreferences,
    collectionSlug: listViewData.collectionSlug,
    columns: listViewData.columnState.map((col) => ({
      accessor: col.accessor,
      active: col.active,
    })),
    components: serializableComponents,
    data: listViewData.data,
    description: staticDescription,
    disableBulkDelete: listViewData.disableBulkDelete,
    disableBulkEdit: listViewData.disableBulkEdit,
    disableQueryPresets: listViewData.disableQueryPresets,
    enableRowSelections: listViewData.enableRowSelections,
    fieldPermissions,
    groupedData: listViewData.groupedData,
    hasCreatePermission: listViewData.hasCreatePermission,
    hasDeletePermission: listViewData.hasDeletePermission,
    hasTrashPermission: listViewData.hasTrashPermission,
    isInDrawer: listViewData.isInDrawer,
    newDocumentURL: listViewData.newDocumentURL,
    orderableFieldName: collectionConfig.orderable === true ? '_order' : undefined,
    query: listViewData.query,
    queryPreset: listViewData.queryPreset,
    queryPresetPermissions: listViewData.queryPresetPermissions,
    resolvedFilterOptions: listViewData.resolvedFilterOptions,
    useAsTitle: collectionConfig.admin.useAsTitle,
    viewType: listViewData.viewType,
  }
}
