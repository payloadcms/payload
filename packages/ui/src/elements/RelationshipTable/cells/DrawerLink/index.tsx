'use client'

import React from 'react'

import type { OnDrawerOpen } from '../../index.js'

import { EditIcon } from '../../../../icons/Edit/index.js'
import { useCellProps } from '../../../../providers/TableColumns/RenderDefaultCell/index.js'
import { DefaultCell } from '../../../Table/DefaultCell/index.js'
import './index.scss'

export const DrawerLink: React.FC<{
  currentDrawerID?: string
  onDrawerOpen: OnDrawerOpen
}> = ({ onDrawerOpen }) => {
  const cellProps = useCellProps()

  return (
    <div className="drawer-link">
      <DefaultCell {...cellProps} className="drawer-link__cell" link={false} onClick={null} />
      <button
        className="drawer-link__doc-drawer-toggler"
        onClick={() => {
          onDrawerOpen(cellProps.rowData.id)
        }}
        type="button"
      >
        <EditIcon />
      </button>
    </div>
  )
}
