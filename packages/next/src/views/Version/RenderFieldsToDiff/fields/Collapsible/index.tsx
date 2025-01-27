'use client'
import type { CollapsibleFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { DiffComponentProps } from '../../types.js'

import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderFieldsToDiff } from '../../index.js'

const baseClass = 'collapsible-diff'

export const Collapsible: React.FC<DiffComponentProps<CollapsibleFieldClient>> = ({
  comparisonValue,
  field,
  fields,
  locales,
  versionField,
  versionValue,
}) => {
  const { i18n } = useTranslation()

  return (
    <div className={baseClass}>
      <DiffCollapser
        comparison={comparisonValue}
        fields={fields}
        label={
          'label' in field &&
          field.label &&
          typeof field.label !== 'function' && <span>{getTranslation(field.label, i18n)}</span>
        }
        locales={locales}
        version={versionValue}
      >
        <RenderFieldsToDiff fields={versionField.fields} />
      </DiffCollapser>
    </div>
  )
}
