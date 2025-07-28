'use client'

import React from 'react'

import type { UseDocumentDrawer } from '../../../DocumentDrawer/types.js'

import { EditIcon } from '../../../../icons/Edit/index.js'
import { useCellProps } from '../../../../providers/TableColumns/RenderDefaultCell/index.js'
import { DefaultCell } from '../../../Table/DefaultCell/index.js'
import './index.scss'

export const DrawerLink: React.FC<{
  readonly DrawerToggler?: ReturnType<UseDocumentDrawer>[0]
}> = (props) => {
  const { DrawerToggler } = props

  const cellProps = useCellProps()

  return (
    <div className="drawer-link">
      <DefaultCell {...cellProps} className="drawer-link__cell" link={false} onClick={null} />
      <DrawerToggler>
        <EditIcon />
      </DrawerToggler>
    </div>
  )
}
