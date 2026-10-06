'use client'

import React from 'react'

import type { OnDrawerOpen } from '../../index.js'

import { WriteIcon } from '../../../../icons/Write/index.js'
import { useCellProps } from '../../../../providers/TableColumns/RenderDefaultCell/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { DefaultCell } from '../../../Table/DefaultCell/index.js'
import './index.css'

export const DrawerLink: React.FC<{
  currentDrawerID?: string
  onDrawerOpen: OnDrawerOpen
}> = ({ onDrawerOpen }) => {
  const cellProps = useCellProps()
  const { t } = useTranslation()

  return (
    <div className="drawer-link">
      <DefaultCell {...cellProps} className="drawer-link__cell" link={false} onClick={null} />
      <button
        aria-label={t('general:edit')}
        className="drawer-link__doc-drawer-toggler"
        onClick={() => {
          onDrawerOpen(cellProps.rowData.id, cellProps.collectionSlug)
        }}
        type="button"
      >
        <WriteIcon />
      </button>
    </div>
  )
}
