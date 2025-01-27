'use client'
import type { CollapsibleFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { DiffComponentProps } from '../../types.js'

import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js'
import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderFieldsToDiff } from '../../index.js'

const baseClass = 'collapsible-diff'

export const Collapsible: React.FC<DiffComponentProps<CollapsibleFieldClient>> = ({
  baseVersionField,
  comparisonValue,
  field,
  versionValue,
}) => {
  const { i18n } = useTranslation()
  const { selectedLocales } = useSelectedLocales()

  return (
    <div className={baseClass}>
      <DiffCollapser
        comparison={comparisonValue}
        fields={field.fields}
        label={
          'label' in field &&
          field.label &&
          typeof field.label !== 'function' && <span>{getTranslation(field.label, i18n)}</span>
        }
        locales={selectedLocales}
        version={versionValue}
      >
        <RenderFieldsToDiff fields={baseVersionField.fields} />
      </DiffCollapser>
    </div>
  )
}
