'use client'
import type { ClientField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { fieldIsArrayType, fieldIsBlockType } from 'payload/shared'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import { FieldDiffCollapser } from '../../FieldDiffCollapser/index.js'
import './index.scss'
import RenderFieldsToDiff from '../../index.js'
import { getFieldsForRowComparison } from './getFieldsForRowComparison.js'

const baseClass = 'iterable-diff'

const Iterable: React.FC<DiffComponentProps> = ({
  comparison,
  diffComponents,
  field,
  fieldPermissions,
  i18n,
  locale,
  locales,
  version,
}) => {
  const versionRowCount = Array.isArray(version) ? version.length : 0
  const comparisonRowCount = Array.isArray(comparison) ? comparison.length : 0
  const maxRows = Math.max(versionRowCount, comparisonRowCount)

  if (!fieldIsArrayType(field) && !fieldIsBlockType(field)) {
    throw new Error(`Expected field to be an array or blocks type but got: ${field.type}`)
  }

  return (
    <div className={baseClass}>
      <FieldDiffCollapser
        comparison={{ [field.name]: comparison }}
        fields={[field]}
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
        version={{ [field.name]: version }}
      >
        {maxRows > 0 && (
          <React.Fragment>
            {Array.from(Array(maxRows).keys()).map((row, i) => {
              const versionRow = version?.[i] || {}
              const comparisonRow = comparison?.[i] || {}

              const fields: ClientField[] = getFieldsForRowComparison({
                comparisonRow,
                field,
                versionRow,
              })

              const rowNumber = String(i + 1).padStart(2, '0')
              const rowLabel = fieldIsArrayType(field) ? `Item ${rowNumber}` : `Block ${rowNumber}`

              return (
                <FieldDiffCollapser
                  comparison={comparisonRow}
                  fields={fields}
                  key={i}
                  label={rowLabel}
                  version={versionRow}
                >
                  <RenderFieldsToDiff
                    comparison={comparisonRow}
                    diffComponents={diffComponents}
                    fieldPermissions={fieldPermissions}
                    fields={fields}
                    i18n={i18n}
                    locales={locales}
                    version={versionRow}
                  />
                </FieldDiffCollapser>
              )
            })}
          </React.Fragment>
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
      </FieldDiffCollapser>
    </div>
  )
}

export default Iterable
