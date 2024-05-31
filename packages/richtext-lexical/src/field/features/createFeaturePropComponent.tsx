'use client'

import type React from 'react'

import { useTableCell } from '@payloadcms/ui/elements/Table'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { useAddClientFunction } from '@payloadcms/ui/providers/ClientFunction'

const useLexicalFeatureProp = <T,>(featureKey: string, componentKey: string, prop: T) => {
  const { schemaPath: schemaPathFromFieldProps } = useFieldProps()
  const tableCell = useTableCell()

  const schemaPathFromCellProps = tableCell?.cellProps?.schemaPath

  const schemaPath = schemaPathFromCellProps || schemaPathFromFieldProps // schemaPathFromCellProps needs to have priority, as there can be cells within fields (e.g. list drawers) and the cell schemaPath needs to be used there - not the parent field schemaPath. There cannot be fields within cells.

  useAddClientFunction(
    `lexicalFeature.${schemaPath}.${featureKey}.components.${componentKey}`,
    prop,
  )
}

export const createFeaturePropComponent = <T = unknown,>(
  prop: T,
): React.FC<{ componentKey: string; featureKey: string }> => {
  return (props) => {
    useLexicalFeatureProp(props.featureKey, props.componentKey, prop)
    return null
  }
}
