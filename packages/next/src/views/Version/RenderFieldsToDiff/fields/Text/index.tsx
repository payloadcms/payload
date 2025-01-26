'use client'
import type { TextFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import Label from '../../Label/index.js'
import { diffStyles } from '../styles.js'
import './index.scss'
import { DiffViewer } from './DiffViewer/index.js'

const baseClass = 'text-diff'

export const Text: React.FC<DiffComponentProps<TextFieldClient>> = ({
  comparison,
  diffMethod,
  field,
  isRichText = false,
  locale,
  version,
}) => {
  const { i18n } = useTranslation()

  let placeholder = ''

  if (version === comparison) {
    placeholder = `[${i18n.t('general:noValue')}]`
  }

  let versionToRender = version
  let comparisonToRender = comparison

  if (isRichText) {
    if (typeof version === 'object') {
      versionToRender = JSON.stringify(version, null, 2)
    }
    if (typeof comparison === 'object') {
      comparisonToRender = JSON.stringify(comparison, null, 2)
    }
  }

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
