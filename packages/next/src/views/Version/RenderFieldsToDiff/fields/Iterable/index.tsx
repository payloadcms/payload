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
  comparisonValue: valueFrom,
  field,
  locale,
  parentIsLocalized,
  versionValue: valueTo,
}) => {
  const { i18n } = useTranslation()
  const { selectedLocales } = useSelectedLocales()
  const { config } = useConfig()

  const versionRowCount = Array.isArray(valueTo) ? valueTo.length : 0
  const comparisonRowCount = Array.isArray(valueFrom) ? valueFrom.length : 0
  const maxRows = Math.max(versionRowCount, comparisonRowCount)

  if (!fieldIsArrayType(field) && !fieldIsBlockType(field)) {
    throw new Error(`Expected field to be an array or blocks type but got: ${field.type}`)
  }

  return (
    <div className={baseClass}>
      <DiffCollapser
        field={field}
        isIterable
        Label={
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
        valueFrom={valueFrom}
        valueTo={valueTo}
      >
        {maxRows > 0 && (
          <div className={`${baseClass}__rows`}>
            {Array.from(Array(maxRows).keys()).map((row, i) => {
              const versionRow = valueTo?.[i] || {}
              const comparisonRow = valueFrom?.[i] || {}

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
                    fields={fields}
                    hideGutter={true}
                    Label={
                      <div className={`${baseClass}-label-container`}>
                        <div className={`${baseClass}-label-prefix`}></div>
                        <span className={`${baseClass}__label`}>{rowLabel}</span>
                      </div>
                    }
                    locales={selectedLocales}
                    parentIsLocalized={parentIsLocalized || field.localized}
                    valueFrom={comparisonRow}
                    valueTo={versionRow}
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
