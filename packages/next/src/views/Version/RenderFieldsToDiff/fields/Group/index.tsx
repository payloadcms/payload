'use client'
import type { GroupFieldDiffClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import './index.scss'

import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js'
import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js'

const baseClass = 'group-diff'

export const Group: GroupFieldDiffClientComponent = ({
  baseVersionField,
  comparisonValue,
  field,
  locale,
  parentIsLocalized,
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
          typeof field.label !== 'function' && (
            <span>
              {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
              {getTranslation(field.label, i18n)}
            </span>
          )
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
