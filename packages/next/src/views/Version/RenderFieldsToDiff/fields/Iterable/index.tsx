'use client'

import type { FieldDiffClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useConfig, useTranslation } from '@payloadcms/ui'

import './index.scss'

import { fieldIsArrayType, fieldIsBlockType } from 'payload/shared'
import React from 'react'

import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js'
import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js'
import { getFieldsForRowComparison } from '../../utilities/getFieldsForRowComparison.js'

const baseClass = 'iterable-diff'

export const Iterable: React.FC<FieldDiffClientProps> = ({
  baseVersionField,
  comparisonValue,
  field,
  locale,
  parentIsLocalized,
  versionValue,
}) => {
  const { i18n } = useTranslation()
  const { selectedLocales } = useSelectedLocales()
  const { config } = useConfig()

  const versionRowCount = Array.isArray(versionValue) ? versionValue.length : 0
  const comparisonRowCount = Array.isArray(comparisonValue) ? comparisonValue.length : 0
  const maxRows = Math.max(versionRowCount, comparisonRowCount)

  if (!fieldIsArrayType(field) && !fieldIsBlockType(field)) {
    throw new Error(`Expected field to be an array or blocks type but got: ${field.type}`)
  }

  return (
    <div className={baseClass}>
      <DiffCollapser
        comparison={comparisonValue}
        field={field}
        isIterable
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
        parentIsLocalized={parentIsLocalized}
        version={versionValue}
      >
        {maxRows > 0 && (
          <div className={`${baseClass}__rows`}>
            {Array.from(Array(maxRows).keys()).map((row, i) => {
              const versionRow = versionValue?.[i] || {}
              const comparisonRow = comparisonValue?.[i] || {}

              const { fields, versionFields } = getFieldsForRowComparison({
                baseVersionField,
                comparisonRow,
                config,
                field,
                row: i,
                versionRow,
              })

              const rowNumber = String(i + 1).padStart(2, '0')
              const rowLabel = fieldIsArrayType(field) ? `Item ${rowNumber}` : `Block ${rowNumber}`

              return (
                <div className={`${baseClass}__row`} key={i}>
                  <DiffCollapser
                    comparison={comparisonRow}
                    fields={fields}
                    label={rowLabel}
                    locales={selectedLocales}
                    parentIsLocalized={parentIsLocalized || field.localized}
                    version={versionRow}
                  >
                    <RenderVersionFieldsToDiff versionFields={versionFields} />
                  </DiffCollapser>
                </div>
              )
            })}
          </div>
        )}
        {maxRows === 0 && (
          <div className={`${baseClass}__no-rows`}>
            {i18n.t('version:noRowsFound', {
              label:
                'labels' in field && field.labels?.plural
                  ? getTranslation(field.labels.plural, i18n)
                  : i18n.t('general:rows'),
            })}
          </div>
        )}
      </DiffCollapser>
    </div>
  )
}
