'use client'
import type { DateFieldDiffClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { FieldDiffLabel, useConfig, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'

import './index.scss'

import React from 'react'

import { diffStyles } from '../styles.js'
import { DiffViewer } from './DiffViewer/index.js'

const baseClass = 'date-diff'

export const DateDiffComponent: DateFieldDiffClientComponent = ({
  comparisonValue: valueFrom,
  diffMethod,
  field,
  locale,
  versionValue: valueTo,
}) => {
  const { i18n } = useTranslation()
  const {
    config: {
      admin: { dateFormat },
    },
  } = useConfig()

  let placeholder = ''

  if (valueTo == valueFrom) {
    placeholder = `[${i18n.t('general:noValue')}]`
  }

  const formattedFromDate = valueFrom
    ? formatDate({
        date: typeof valueFrom === 'string' ? new Date(valueFrom) : (valueFrom as Date),
        i18n,
        pattern: dateFormat,
      })
    : ''

  const formattedToDate = valueTo
    ? formatDate({
        date: typeof valueTo === 'string' ? new Date(valueTo) : (valueTo as Date),
        i18n,
        pattern: dateFormat,
      })
    : ''

  return (
    <div className={baseClass}>
      <FieldDiffLabel>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {'label' in field &&
          typeof field.label !== 'function' &&
          getTranslation(field.label || '', i18n)}
      </FieldDiffLabel>
      <DiffViewer
        diffMethod={diffMethod}
        diffStyles={diffStyles}
        placeholder={placeholder}
        renderedValueFrom={formattedFromDate}
        renderedValueTo={formattedToDate}
      />
    </div>
  )
}
