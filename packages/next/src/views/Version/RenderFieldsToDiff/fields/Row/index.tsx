'use client'
import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import { RenderFieldsToDiff } from '../../index.js'
import Label from '../../Label/index.js'

const baseClass = 'row-diff'

export const Row: React.FC<DiffComponentProps> = ({ field, versionField }) => {
  const { i18n } = useTranslation()

  return (
    <div className={baseClass}>
      {'label' in field && field.label && typeof field.label !== 'function' && (
        <Label>{getTranslation(field.label, i18n)}</Label>
      )}
      <RenderFieldsToDiff fields={versionField.fields} />
    </div>
  )
}
