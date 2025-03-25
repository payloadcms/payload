'use client'
import type { TextFieldDiffClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import Label from '../../Label/index.js'
import './index.scss'
import { diffStyles } from '../styles.js'
import { DiffViewer } from './DiffViewer/index.js'

const baseClass = 'text-diff'

export const Text: TextFieldDiffClientComponent = ({
  comparisonValue,
  diffMethod,
  field,
  locale,
  versionValue,
}) => {
  const { i18n } = useTranslation()

  let placeholder = ''

  if (versionValue == comparisonValue) {
    placeholder = `[${i18n.t('general:noValue')}]`
  }

  const versionToRender: string =
    typeof versionValue === 'string' ? versionValue : JSON.stringify(versionValue, null, 2)
  const comparisonToRender =
    typeof comparisonValue === 'string' ? comparisonValue : JSON.stringify(comparisonValue, null, 2)

  return (
    <div className={baseClass}>
      <Label>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {'label' in field &&
          typeof field.label !== 'function' &&
          getTranslation(field.label || '', i18n)}
      </Label>
      <DiffViewer
        comparisonToRender={comparisonToRender}
        diffMethod={diffMethod}
        diffStyles={diffStyles}
        placeholder={placeholder}
        versionToRender={versionToRender}
      />
    </div>
  )
}
