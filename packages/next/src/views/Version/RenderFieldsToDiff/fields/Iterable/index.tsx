'use client'
import type { ClientField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { getUniqueListBy } from 'payload/shared'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import FieldDiffCollapser from '../../FieldDiffCollapser/index.js'
import RenderFieldsToDiff from '../../index.js'
import './index.scss'

const baseClass = 'iterable-diff'

const Iterable: React.FC<DiffComponentProps> = ({
  comparison,
  diffComponents,
  field,
  i18n,
  locale,
  locales,
  permissions,
  version,
}) => {
  const versionRowCount = Array.isArray(version) ? version.length : 0
  const comparisonRowCount = Array.isArray(comparison) ? comparison.length : 0
  const maxRows = Math.max(versionRowCount, comparisonRowCount)

  return (
    <div className={baseClass}>
      <FieldDiffCollapser
        comparison={comparison}
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
        version={version}
      >
        {maxRows > 0 && (
          <React.Fragment>
            {Array.from(Array(maxRows).keys()).map((row, i) => {
              const versionRow = version?.[i] || {}
              const comparisonRow = comparison?.[i] || {}

              let fields: ClientField[] = []

              if (field.type === 'array' && 'fields' in field) {
                fields = field.fields
              }

              if (field.type === 'blocks') {
                fields = [
                  // {
                  //   name: 'blockType',
                  //   label: i18n.t('fields:blockType'),
                  //   type: 'text',
                  // },
                ]

                if (versionRow?.blockType === comparisonRow?.blockType) {
                  const matchedBlock = ('blocks' in field &&
                    field.blocks?.find((block) => block.slug === versionRow?.blockType)) || {
                    fields: [],
                  }

                  fields = [...fields, ...matchedBlock.fields]
                } else {
                  const matchedVersionBlock = ('blocks' in field &&
                    field.blocks?.find((block) => block.slug === versionRow?.blockType)) || {
                    fields: [],
                  }

                  const matchedComparisonBlock = ('blocks' in field &&
                    field.blocks?.find((block) => block.slug === comparisonRow?.blockType)) || {
                    fields: [],
                  }

                  fields = getUniqueListBy<ClientField>(
                    [...fields, ...matchedVersionBlock.fields, ...matchedComparisonBlock.fields],
                    'name',
                  )
                }
              }

              const iterableItemNumber = String(i + 1).padStart(2, '0')
              let iterableItemLabel = `Item ${iterableItemNumber}`

              // If the field has labels, use the singular form
              if ('labels' in field && field.labels && typeof field.labels !== 'function') {
                iterableItemLabel = `${getTranslation(field.labels.singular, i18n)} ${iterableItemNumber}`
              }

              return (
                <FieldDiffCollapser
                  comparison={comparisonRow}
                  key={i}
                  label={iterableItemLabel}
                  version={versionRow}
                >
                  <RenderFieldsToDiff
                    comparison={comparisonRow}
                    diffComponents={diffComponents}
                    fieldPermissions={permissions}
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
