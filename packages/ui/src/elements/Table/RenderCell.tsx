import type { CellComponentProps, ClientField } from 'payload'

import React, { useMemo } from 'react'

import type { Column } from './index.js'

import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { TableCellProvider } from './TableCellProvider/index.js'

export const RenderCell: React.FC<{
  readonly cellPropOverrides?: Partial<CellComponentProps>
  readonly col: Column
  readonly colIndex: number
  readonly customCellContext?: Record<string, unknown>
  readonly row: Record<string, unknown>
}> = (props) => {
  const { cellPropOverrides, col, colIndex, customCellContext, row } = props

  const cellProps: Partial<CellComponentProps> = useMemo(() => {
    return {
      ...col?.cellProps,
      ...(cellPropOverrides || {}),
      field: {
        ...col?.cellProps?.field,
        ...(cellPropOverrides?.field || {}),
        admin: {
          ...col?.cellProps?.field?.admin,
          ...(cellPropOverrides?.field?.admin || {}),
          components: {
            ...col?.cellProps?.field?.admin?.components,
            ...(cellPropOverrides?.field?.admin?.components || {}),
          },
        },
      } as ClientField,
    }
  }, [cellPropOverrides, col])

  return (
    <td className={`cell-${col.accessor}`} key={colIndex}>
      <TableCellProvider
        cellData={row[col.accessor]}
        cellProps={cellProps}
        columnIndex={colIndex}
        customCellContext={customCellContext}
        rowData={row}
      >
        <RenderComponent
          clientProps={cellProps}
          mappedComponent={cellProps.field.admin.components?.Cell}
        />
      </TableCellProvider>
    </td>
  )
}
