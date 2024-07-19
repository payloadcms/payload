'use client'
import type { CellComponentProps, DefaultCellComponentProps } from 'payload'

import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import { getSelectedOptionLabels } from '../../../../../fields/Select/utils.js'

export interface SelectCellProps extends DefaultCellComponentProps<any> {
  options: CellComponentProps['options']
}

export const SelectCell: React.FC<SelectCellProps> = ({ cellData, options }) => {
  const { i18n } = useTranslation()

  const content = [
    ...getSelectedOptionLabels({
      selectedOptions: Array.isArray(cellData) ? cellData : [cellData],
      options,
      i18n,
    }),
  ].join(', ')

  return <span>{content}</span>
}
