import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientConfig,
  Column,
  ImportMap,
  Payload,
  SanitizedCollectionConfig,
  SanitizedFieldsPermissions,
} from 'payload'

import type { SerializableTableStateData } from './buildTableState.js'

import { RenderClientComponent } from '../elements/RenderServerComponent/clientOnly.js'
import { renderTable } from './renderTable.js'

export type BuildTableStateClientPropsArgs = {
  clientConfig: ClientConfig
  i18n: I18nClient
  importMap: ImportMap
  tableStateData: SerializableTableStateData
}

export type BuildTableStateClientPropsResult = {
  state: Column[]
  Table: React.ReactNode
}

/**
 * Reconstruct the `{state, Table}` pair from the data-only payload returned by
 * `buildTableStateHandler` when `mode === 'data-only'`.
 *
 * Designed for non-RSC adapters (e.g. TanStack Start) where the server function
 * result crosses a JSON boundary that drops React elements. Mirrors the
 * approach used by `buildListViewClientProps` for the list view.
 *
 * `renderTable` and `buildColumnState` expect separate `clientFields` and
 * `serverFields` arrays. On the client we only have the sanitized client
 * config, which preserves the references `buildColumnState` actually reads
 * (`field.admin.components.Cell/Label`, `field.editor.CellComponent`), so the
 * same array is used in both slots via the payload proxy / collectionConfig.
 */
export function buildTableStateClientProps({
  clientConfig,
  i18n,
  importMap,
  tableStateData,
}: BuildTableStateClientPropsArgs): BuildTableStateClientPropsResult {
  const {
    collectionSlug,
    columns,
    customCellProps,
    data,
    enableRowSelections,
    fieldPermissions,
    orderableFieldName,
    query,
    renderRowTypes,
    tableAppearance,
    useAsTitle,
  } = tableStateData

  const isPolymorphic = Array.isArray(collectionSlug)

  const clientCollectionConfig = isPolymorphic
    ? undefined
    : clientConfig.collections.find((c) => c.slug === collectionSlug)

  // Minimal payload proxy: only properties read by `renderTable` /
  // `buildColumnState` are required. Polymorphic table-state rendering looks
  // up `payload.collections[slug].config.{labels, fields}` to build cells and
  // row-type pills, so synthesize entries for each slug.
  const payloadProxy = {
    collections: isPolymorphic
      ? Object.fromEntries(
          collectionSlug.map((slug) => {
            const config = clientConfig.collections.find((c) => c.slug === slug)
            return [slug, { config }]
          }),
        )
      : clientCollectionConfig
        ? { [clientCollectionConfig.slug]: { config: clientCollectionConfig } }
        : {},
    config: { routes: { admin: clientConfig.routes?.admin ?? '/admin' } },
    importMap,
  } as unknown as Payload

  // Non-polymorphic path: provide a `collectionConfig` so `renderTable`'s
  // `serverFields` is populated. We hand it the same client field array — the
  // properties `buildColumnState` reads off `serverField` (custom Cell/Label,
  // richText editor.CellComponent) survive client-config sanitization.
  const collectionConfigShim =
    !isPolymorphic && clientCollectionConfig
      ? ({
          ...clientCollectionConfig,
          fields: clientCollectionConfig.fields,
        } as unknown as SanitizedCollectionConfig)
      : undefined

  const { columnState, Table } = renderTable({
    clientCollectionConfig,
    clientConfig,
    collectionConfig: collectionConfigShim,
    collections: isPolymorphic ? collectionSlug : undefined,
    columns,
    customCellProps,
    data,
    enableRowSelections,
    fieldPermissions,
    i18n,
    orderableFieldName,
    payload: payloadProxy,
    query,
    renderComponent: RenderClientComponent,
    renderRowTypes,
    tableAppearance,
    useAsTitle,
  })

  return { state: columnState, Table }
}
