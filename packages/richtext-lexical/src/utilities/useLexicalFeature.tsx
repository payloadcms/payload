'use client'

import { useAddClientFunction } from '@payloadcms/ui'

import type { FeatureProviderClient } from '../features/typesClient.js'

import { useEditorConfigContext } from '../lexical/config/client/EditorConfigProvider.js'

export const useLexicalFeature = <ClientFeatureProps,>(
  featureKey: string,
  feature: FeatureProviderClient<ClientFeatureProps>,
) => {
  const {
    fieldProps: { schemaPath: schemaPathFromFieldProps },
  } = useEditorConfigContext()
  const tableCell = { cellProps: { schemaPath: [] } } // TODO: get tableCell from props
  // const tableCell = useTableCell()

  const schemaPathFromCellProps = tableCell?.cellProps?.schemaPath
    ? tableCell?.cellProps?.schemaPath.join('.')
    : null

  const schemaPath = schemaPathFromCellProps || schemaPathFromFieldProps // schemaPathFromCellProps needs to have priority, as there can be cells within fields (e.g. list drawers) and the cell schemaPath needs to be used there - not the parent field schemaPath. There cannot be fields within cells.

  useAddClientFunction(`lexicalFeature.${schemaPath}.${featureKey}`, feature)
}
