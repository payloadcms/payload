'use client'
import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { useListDrawerContext } from '../../../elements/ListDrawer/Provider.js'
import { DefaultCell } from '../../../elements/Table/DefaultCell/index.js'
import { useTableColumns } from '../../../providers/TableColumns/index.js'
import './index.scss'

const baseClass = 'default-cell'

const CellPropsContext = React.createContext<DefaultCellComponentProps | null>(null)

export const useCellProps = (): DefaultCellComponentProps | null => React.use(CellPropsContext)

export const RenderDefaultCell: React.FC<{
  clientProps: DefaultCellComponentProps
  columnIndex: number
  customCell?: React.ReactNode
  enableRowSelections?: boolean
  isLinkedColumn?: boolean
}> = ({ clientProps, columnIndex, customCell, isLinkedColumn }) => {
  const { drawerSlug, onSelect } = useListDrawerContext()
  const { LinkedCellOverride } = useTableColumns()

  const propsToPass: DefaultCellComponentProps = {
    ...clientProps,
    columnIndex,
  }

  const isInDrawer = isLinkedColumn && drawerSlug

  if (isInDrawer) {
    propsToPass.className = `${baseClass}__first-cell`
    propsToPass.link = false
    propsToPass.onClick = ({ collectionSlug: rowColl, rowData }) => {
      if (typeof onSelect === 'function') {
        onSelect({
          collectionSlug: rowColl,
          doc: rowData,
          docID: rowData.id as string,
        })
      }
    }
  }

  // When we have a custom cell and we're in a drawer, wrap it with a div that captures clicks
  // This prevents any nested Link components from navigating and instead triggers selection
  if (customCell && isInDrawer) {
    return (
      <CellPropsContext value={propsToPass}>
        <button
          className={`${baseClass}__first-cell`}
          onClick={(e) => {
            // Prevent any nested links from navigating
            e.preventDefault()
            e.stopPropagation()
            if (typeof onSelect === 'function') {
              onSelect({
                collectionSlug: clientProps.collectionSlug,
                doc: clientProps.rowData,
                docID: clientProps.rowData?.id as string,
              })
            }
          }}
          onClickCapture={(e) => {
            // Capture phase to intercept link clicks before they navigate
            e.preventDefault()
            e.stopPropagation()
            if (typeof onSelect === 'function') {
              onSelect({
                collectionSlug: clientProps.collectionSlug,
                doc: clientProps.rowData,
                docID: clientProps.rowData?.id as string,
              })
            }
          }}
          type="button"
        >
          {customCell}
        </button>
      </CellPropsContext>
    )
  }

  // When we have a custom cell but not in a drawer, render it as-is
  if (customCell) {
    return <CellPropsContext value={propsToPass}>{customCell}</CellPropsContext>
  }

  return (
    <CellPropsContext value={propsToPass}>
      {isLinkedColumn && LinkedCellOverride ? LinkedCellOverride : <DefaultCell {...propsToPass} />}
    </CellPropsContext>
  )
}
