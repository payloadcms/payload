'use client'
import type { CellComponentProps, DefaultCellComponentProps, Option, OptionObject } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'

export interface SelectCellProps extends DefaultCellComponentProps<any> {
  options: CellComponentProps['options']
}

export const SelectCell: React.FC<SelectCellProps> = ({ cellData, options: allOptions }) => {
  const { i18n } = useTranslation()

  function createCellText(selectedOptions: string[], options: Option[] = allOptions) {
    return selectedOptions.reduce((acc: string[], selectedOption) => {
      options.forEach((option) => {
        if (typeof option === 'string') {
          if (option === selectedOption) acc.push(getTranslation(option, i18n))
        } else if ('options' in option) {
          acc.push(...createCellText(selectedOptions, option.options))
        } else {
          acc.push(getTranslation(option.label, i18n))
        }
      })
      return acc
    }, [])
  }

  const content = createCellText(Array.isArray(cellData) ? cellData : [cellData]).join(', ')

  return <span>{content}</span>
}
