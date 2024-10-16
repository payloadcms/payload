'use client'
import type { CellComponentProps, JoinFieldClient } from 'payload'

import React, { useCallback } from 'react'

import type { DocumentDrawerProps } from '../../../DocumentDrawer/types.js'

import { EditIcon } from '../../../../icons/Edit/index.js'
import { useDocumentDrawer } from '../../../DocumentDrawer/index.js'
import { DefaultCell } from '../../../Table/DefaultCell/index.js'
import { useTableCell } from '../../../Table/index.js'
import './index.scss'

export const DrawerLink: React.FC<
  {
    readonly onDrawerSave?: DocumentDrawerProps['onSave']
  } & CellComponentProps<JoinFieldClient>
> = (props) => {
  const context = useTableCell()
  const { field, onDrawerSave: onDrawerSaveFromProps } = props

  const {
    cellProps,
    customCellContext: { collectionSlug },
    rowData,
  } = context

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
    id: rowData.id,
    collectionSlug,
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
      <DefaultCell field={field} {...cellProps} className="drawer-link__cell" />
      <DocumentDrawerToggler>
        <EditIcon />
      </DocumentDrawerToggler>
      <DocumentDrawer onSave={onDrawerSave} />
    </div>
  )
}
