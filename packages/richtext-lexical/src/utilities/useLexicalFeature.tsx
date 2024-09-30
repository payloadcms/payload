'use client'

import { useAddClientFunction, useFieldProps, useTableCell } from '@payloadcms/ui'

import type { FeatureProviderClient } from '../features/typesClient.js'

export const useLexicalFeature = <ClientFeatureProps,>(
  featureKey: string,
  feature: FeatureProviderClient<ClientFeatureProps>,
) => {
  const { schemaPath: schemaPathFromFieldProps } = useFieldProps()
  const tableCell = useTableCell()

  const schemaPathFromCellProps = tableCell?.cellProps?.field?._schemaPath

  const schemaPath = schemaPathFromCellProps || schemaPathFromFieldProps // schemaPathFromCellProps needs to have priority, as there can be cells within fields (e.g. list drawers) and the cell schemaPath needs to be used there - not the parent field schemaPath. There cannot be fields within cells.

  useAddClientFunction(`lexicalFeature.${schemaPath}.${featureKey}`, feature)
}
