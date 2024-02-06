'use client'
import React from 'react'

import type { CellComponentProps, OptionObject } from 'payload/types'

import { optionsAreObjects } from 'payload/types'
import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '../../../../../providers/Translation'

export const SelectCell: React.FC<CellComponentProps<any>> = ({ data, field }) => {
  const { i18n } = useTranslation()

  const findLabel = (items: string[]) =>
    items
      .map((i) => {
        const found = (field.options as OptionObject[]).filter(
          (f: OptionObject) => f.value === i,
        )?.[0]?.label
        return getTranslation(found, i18n)
      })
      .join(', ')

  let content = ''
  if (optionsAreObjects(field.options)) {
    content = Array.isArray(data)
      ? findLabel(data) // hasMany
      : findLabel([data])
  } else {
    content = Array.isArray(data)
      ? data.join(', ') // hasMany
      : data
  }

  return <span>{content}</span>
}
