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

  function createCellText(selectedOptions: string[], options: Option[] = allOptions): Set<string> {
    return selectedOptions.reduce((acc: Set<string>, selectedOption) => {
      options.forEach((option) => {
        if (typeof option === 'string') {
          if (option === selectedOption) acc.add(getTranslation(option, i18n))
        } else if ('options' in option) {
          acc = new Set([...acc, ...createCellText(selectedOptions, option.options)])
        } else if (option.value === selectedOption) {
          acc.add(getTranslation(option.label, i18n))
        }
      })

      return acc
    }, new Set<string>())
  }

  const content = [...createCellText(Array.isArray(cellData) ? cellData : [cellData])].join(', ')

  return <span>{content}</span>
}
