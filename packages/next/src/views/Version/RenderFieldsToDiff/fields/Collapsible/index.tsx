'use client'
import type { CollapsibleFieldDiffClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js'
import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js'

const baseClass = 'collapsible-diff'

export const Collapsible: CollapsibleFieldDiffClientComponent = ({
  baseVersionField,
  comparisonValue,
  field,
  parentIsLocalized,
  versionValue,
}) => {
  const { i18n } = useTranslation()
  const { selectedLocales } = useSelectedLocales()

  if (!baseVersionField.fields?.length) {
    return null
  }

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
        parentIsLocalized={parentIsLocalized || field.localized}
        version={versionValue}
      >
        <RenderVersionFieldsToDiff versionFields={baseVersionField.fields} />
      </DiffCollapser>
    </div>
  )
}
