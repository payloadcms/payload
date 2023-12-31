import React from 'react'
import { useTranslation } from 'react-i18next'

import type { ArrayField, BlockField, Field } from '../../../../../../../fields/config/types'
import type { Props } from '../types'

import RenderFieldsToDiff from '../..'
import { fieldAffectsData } from '../../../../../../../fields/config/types'
import { getTranslation } from '../../../../../../../utilities/getTranslation'
import getUniqueListBy from '../../../../../../../utilities/getUniqueListBy'
import Label from '../../Label'
import './index.scss'

const baseClass = 'iterable-diff'

const Iterable: React.FC<Props & { field: ArrayField | BlockField }> = ({
  comparison,
  field,
  fieldComponents,
  locale,
  locales,
  permissions,
  version,
}) => {
  const versionRowCount = Array.isArray(version) ? version.length : 0
  const comparisonRowCount = Array.isArray(comparison) ? comparison.length : 0
  const maxRows = Math.max(versionRowCount, comparisonRowCount)
  const { i18n, t } = useTranslation('version')

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

            let subFields: Field[] = []

            if (field.type === 'array') subFields = field.fields

            if (field.type === 'blocks') {
              subFields = [
                {
                  name: 'blockType',
                  label: t('fields:blockType'),
                  type: 'text',
                },
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
                  fieldComponents={fieldComponents}
                  fieldPermissions={permissions}
                  fields={subFields.filter(
                    (subField) => !(fieldAffectsData(subField) && subField.name === 'id'),
                  )}
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
          {t('noRowsFound', {
            label: field.labels?.plural
              ? getTranslation(field.labels?.plural, i18n)
              : t('general:rows'),
          })}
        </div>
      )}
    </div>
  )
}

export default Iterable
