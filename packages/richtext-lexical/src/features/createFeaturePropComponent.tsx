'use client'

import type React from 'react'

import { useAddClientFunction, useFieldProps, useTableCell } from '@payloadcms/ui'

const useLexicalFeatureProp = <T,>(featureKey: string, componentKey: string, prop: T) => {
  const { schemaPath: schemaPathFromFieldProps } = useFieldProps()
  const tableCell = useTableCell()

  const schemaPathFromCellProps = tableCell?.cellProps?.field?._schemaPath

  const schemaPath = schemaPathFromCellProps || schemaPathFromFieldProps // schemaPathFromCellProps needs to have priority, as there can be cells within fields (e.g. list drawers) and the cell schemaPath needs to be used there - not the parent field schemaPath. There cannot be fields within cells.

  useAddClientFunction(
    `lexicalFeature.${schemaPath}.${featureKey}.lexical_internal_components.${componentKey}`,
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
