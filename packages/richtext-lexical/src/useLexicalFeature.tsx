'use client'

import { useTableCell } from '@payloadcms/ui/elements/Table'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { useAddClientFunction } from '@payloadcms/ui/providers/ClientFunction'

import type { FeatureProviderClient } from './field/features/types.js'

export const useLexicalFeature = <ClientFeatureProps,>(
  featureKey: string,
  feature: FeatureProviderClient<ClientFeatureProps>,
) => {
  const { schemaPath: schemaPathFromFieldProps } = useFieldProps()
  const tableCell = useTableCell()

  const schemaPathFromCellProps = tableCell?.cellProps?.schemaPath

  const schemaPath = schemaPathFromFieldProps || schemaPathFromCellProps

  useAddClientFunction(`lexicalFeature.${schemaPath}.${featureKey}`, feature)
}
