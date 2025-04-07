'use client'
import type { TextFieldDiffClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { FieldDiffLabel, useTranslation } from '@payloadcms/ui'
import React from 'react'

import './index.scss'
import { diffStyles } from '../styles.js'
import { DiffViewer } from './DiffViewer/index.js'

const baseClass = 'text-diff'

export const Text: TextFieldDiffClientComponent = ({
  comparisonValue: valueFrom,
  diffMethod,
  field,
  locale,
  versionValue: valueTo,
}) => {
  const { i18n } = useTranslation()

  let placeholder = ''

  if (valueTo == valueFrom) {
    placeholder = `[${i18n.t('general:noValue')}]`
  }

  const renderedValueTo: string =
    typeof valueTo === 'string' ? valueTo : JSON.stringify(valueTo, null, 2)
  const renderedValueFrom =
    typeof valueFrom === 'string' ? valueFrom : JSON.stringify(valueFrom, null, 2)

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
        renderedValueFrom={renderedValueFrom}
        renderedValueTo={renderedValueTo}
      />
    </div>
  )
}
