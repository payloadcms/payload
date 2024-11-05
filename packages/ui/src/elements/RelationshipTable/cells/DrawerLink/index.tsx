'use client'

import React, { useCallback } from 'react'

import type { DocumentDrawerProps } from '../../../DocumentDrawer/types.js'

import { EditIcon } from '../../../../icons/Edit/index.js'
import { useDocumentDrawer } from '../../../DocumentDrawer/index.js'
import { DefaultCell } from '../../../Table/DefaultCell/index.js'
import { useCellProps } from '../../../TableColumns/RenderDefaultCell/index.js'
import './index.scss'

export const DrawerLink: React.FC<{
  readonly onDrawerSave?: DocumentDrawerProps['onSave']
}> = (props) => {
  const { onDrawerSave: onDrawerSaveFromProps } = props

  const cellProps = useCellProps()

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
    id: cellProps?.rowData.id,
    collectionSlug: cellProps?.collectionConfig.slug,
  })

  const onDrawerSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      closeDrawer()

      if (typeof onDrawerSaveFromProps === 'function') {
        void onDrawerSaveFromProps(args)
      }
    },
    [closeDrawer, onDrawerSaveFromProps],
  )

  return (
    <div className="drawer-link">
      <DefaultCell {...cellProps} className="drawer-link__cell" link={false} onClick={null} />
      <DocumentDrawerToggler>
        <EditIcon />
      </DocumentDrawerToggler>
      <DocumentDrawer onSave={onDrawerSave} />
    </div>
  )
}
