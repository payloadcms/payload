import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { Field } from 'payload/types'
import type { Props } from '../types'

import RenderFieldsToDiff from '../..'
import { getUniqueListBy } from 'payload/utilities'
import Label from '../../Label'
import { MappedField } from '@payloadcms/ui'

import './index.scss'

const baseClass = 'iterable-diff'

const Iterable: React.FC<Props> = ({
  comparison,
  field,
  locale,
  locales,
  permissions,
  version,
  i18n,
  diffComponents,
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
                ) || { fields: [] }

                subFields = [...subFields, ...matchedBlock.fields]
              } else {
                const matchedVersionBlock = field.blocks.find(
                  (block) => block.slug === versionRow?.blockType,
                ) || { fields: [] }

                const matchedComparisonBlock = field.blocks.find(
                  (block) => block.slug === comparisonRow?.blockType,
                ) || { fields: [] }

                subFields = getUniqueListBy<Field>(
                  [...subFields, ...matchedVersionBlock.fields, ...matchedComparisonBlock.fields],
                  'name',
                )
              }
            }

            return (
              <div className={`${baseClass}__wrap`} key={i}>
                <RenderFieldsToDiff
                  comparison={comparisonRow}
                  fieldMap={subFields}
                  fieldPermissions={permissions}
                  locales={locales}
                  version={versionRow}
                  i18n={i18n}
                  diffComponents={diffComponents}
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
