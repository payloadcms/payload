'use client'
import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderFieldsToDiff } from '../../index.js'

const baseClass = 'collapsible-diff'

export const Collapsible: React.FC<DiffComponentProps> = ({
  comparison,
  field,
  fields,
  locales,
  version,
  versionField,
}) => {
  const { i18n } = useTranslation()

  return (
    <div className={baseClass}>
      <DiffCollapser
        comparison={comparison}
        fields={fields}
        label={
          'label' in field &&
          field.label &&
          typeof field.label !== 'function' && <span>{getTranslation(field.label, i18n)}</span>
        }
        locales={locales}
        version={version}
      >
        <RenderFieldsToDiff fields={versionField.fields} />
      </DiffCollapser>
    </div>
  )
}
