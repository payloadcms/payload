import type { MappedField } from '@payloadcms/ui'

import { getTranslation } from '@payloadcms/translations'
import { getUniqueListBy } from 'payload/utilities'
import React from 'react'

import type { Props } from '../types.js'

import Label from '../../Label/index.js'
import RenderFieldsToDiff from '../../index.js'
import './index.scss'

const baseClass = 'iterable-diff'

const Iterable: React.FC<Props> = ({
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
      {field.label && (
        <Label>
          {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
          {getTranslation(field.label, i18n)}
        </Label>
      )}
      {maxRows > 0 && (
        <React.Fragment>
          {Array.from(Array(maxRows).keys()).map((row, i) => {
            const versionRow = version?.[i] || {}
            const comparisonRow = comparison?.[i] || {}

            let subFields: MappedField[] = []

            if (field.type === 'array') subFields = field.subfields

            if (field.type === 'blocks') {
              subFields = [
                // {
                //   name: 'blockType',
                //   label: i18n.t('fields:blockType'),
                //   type: 'text',
                // },
              ]

              if (versionRow?.blockType === comparisonRow?.blockType) {
                const matchedBlock = field.blocks.find(
                  (block) => block.slug === versionRow?.blockType,
                ) || { subfields: [] }

                subFields = [...subFields, ...matchedBlock.subfields]
              } else {
                const matchedVersionBlock = field.blocks.find(
                  (block) => block.slug === versionRow?.blockType,
                ) || { subfields: [] }

                const matchedComparisonBlock = field.blocks.find(
                  (block) => block.slug === comparisonRow?.blockType,
                ) || { subfields: [] }

                subFields = getUniqueListBy<MappedField>(
                  [
                    ...subFields,
                    ...matchedVersionBlock.subfields,
                    ...matchedComparisonBlock.subfields,
                  ],
                  'name',
                )
              }
            }

            return (
              <div className={`${baseClass}__wrap`} key={i}>
                <RenderFieldsToDiff
                  comparison={comparisonRow}
                  diffComponents={diffComponents}
                  fieldMap={subFields}
                  fieldPermissions={permissions}
                  i18n={i18n}
                  locales={locales}
                  version={versionRow}
                />
              </div>
            )
          })}
        </React.Fragment>
      )}
      {maxRows === 0 && (
        <div className={`${baseClass}__no-rows`}>
          {i18n.t('version:noRowsFound', {
            label: field.labels?.plural
              ? getTranslation(field.labels?.plural, i18n)
              : i18n.t('general:rows'),
          })}
        </div>
      )}
    </div>
  )
}

export default Iterable
