'use client'
import type { CollapsibleFieldDiffClientComponent } from '@ruya.sa/payload'

import { getTranslation } from '@ruya.sa/translations'
import { useTranslation } from '@ruya.sa/ui'
import React from 'react'

import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js'
import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js'

const baseClass = 'collapsible-diff'

export const Collapsible: CollapsibleFieldDiffClientComponent = ({
  baseVersionField,
  comparisonValue: valueFrom,
  field,
  parentIsLocalized,
  versionValue: valueTo,
}) => {
  const { i18n } = useTranslation()
  const { selectedLocales } = useSelectedLocales()

  if (!baseVersionField.fields?.length) {
    return null
  }

  return (
    <div className={baseClass}>
      <DiffCollapser
        fields={field.fields}
        Label={
          'label' in field &&
          field.label &&
          typeof field.label !== 'function' && <span>{getTranslation(field.label, i18n)}</span>
        }
        locales={selectedLocales}
        parentIsLocalized={parentIsLocalized || field.localized}
        valueFrom={valueFrom}
        valueTo={valueTo}
      >
        <RenderVersionFieldsToDiff versionFields={baseVersionField.fields} />
      </DiffCollapser>
    </div>
  )
}
