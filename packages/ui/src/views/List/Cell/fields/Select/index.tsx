'use client'
import React from 'react'

import type { CellComponentProps, CellProps, OptionObject } from 'payload/types'

import { optionsAreObjects } from 'payload/types'
import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '../../../../../providers/Translation'

export interface SelectCellProps extends CellComponentProps<any> {
  options: CellProps['options']
}

export const SelectCell: React.FC<SelectCellProps> = ({ cellData, options }) => {
  const { i18n } = useTranslation()

  const findLabel = (items: string[]) =>
    items
      .map((i) => {
        const found = (options as OptionObject[]).filter((f: OptionObject) => f.value === i)?.[0]
          ?.label
        return getTranslation(found, i18n)
      })
      .join(', ')

  let content = ''
  if (optionsAreObjects(options)) {
    content = Array.isArray(cellData)
      ? findLabel(cellData) // hasMany
      : findLabel([cellData])
  } else {
    content = Array.isArray(cellData)
      ? cellData.join(', ') // hasMany
      : cellData
  }

  return <span>{content}</span>
}
