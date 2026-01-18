'use client'
import type { DefaultCellComponentProps, OptionObject, SelectFieldClient } from '@ruya.sa/payload'

import { getTranslation } from '@ruya.sa/translations'
import { optionsAreObjects } from '@ruya.sa/payload/shared'
import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'

export interface SelectCellProps extends DefaultCellComponentProps<SelectFieldClient> {}

export const SelectCell: React.FC<SelectCellProps> = ({ cellData, field: { options } }) => {
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
