'use client'
import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { useListInfo } from '../../../providers/ListInfo/index.js'
import { DefaultCell } from '../../Table/DefaultCell/index.js'
import './index.scss'

const baseClass = 'default-cell'

export const RenderDefaultCell: React.FC<{
  addOnClick
  clientProps: DefaultCellComponentProps
  enableRowSelections?: boolean
  index: number
  isLinkedColumn?: boolean
}> = ({ addOnClick, clientProps, isLinkedColumn }) => {
  const { onSelect } = useListInfo()

  const propsToPass = { ...clientProps }

  if (isLinkedColumn && addOnClick) {
    propsToPass.className = `${baseClass}__first-cell`
    propsToPass.link = false

    propsToPass.onClick = ({ collectionSlug: rowColl, rowData }) => {
      if (typeof onSelect === 'function') {
        onSelect({
          collectionSlug: rowColl,
          docID: rowData.id as string,
        })
      }
    }
  }

  return <DefaultCell {...propsToPass} />
}
