'use client'
import type { DefaultCellComponentProps, SelectFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { optionsAreObjects } from 'payload/shared'
import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import './index.css'

export type StatusCellProps = DefaultCellComponentProps<SelectFieldClient>

const baseClass = 'status-cell'

export const StatusCell: React.FC<StatusCellProps> = ({ cellData, field: { options } }) => {
  const { i18n } = useTranslation()

  const findLabel = (value: string) => {
    if (optionsAreObjects(options)) {
      const found = options.find((opt) => opt.value === value)
      return found ? getTranslation(found.label, i18n) : value
    }
    return value
  }

  if (!cellData) {
    return null
  }

  const status = Array.isArray(cellData) ? cellData[0] : cellData
  const label = findLabel(status)

  let statusModifier = 'draft'
  if (status === 'published') {
    statusModifier = 'published'
  } else if (status === 'changed') {
    statusModifier = 'changed'
  } else if (status === 'previouslyPublished') {
    statusModifier = 'previously-published'
  }

  return (
    <span className={`${baseClass} ${baseClass}--${statusModifier}`}>
      <span className={`${baseClass}__label`}>{label}</span>
    </span>
  )
}
