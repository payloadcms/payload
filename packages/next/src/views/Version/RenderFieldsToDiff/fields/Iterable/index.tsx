import type { ClientFieldConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { getUniqueListBy } from 'payload/shared'
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
      {'label' in field.fieldComponentProps &&
        field.fieldComponentProps.label &&
        typeof field.fieldComponentProps.label !== 'function' && (
          <Label>
            {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
            {getTranslation(field.fieldComponentProps.label, i18n)}
          </Label>
        )}
      {maxRows > 0 && (
        <React.Fragment>
          {Array.from(Array(maxRows).keys()).map((row, i) => {
            const versionRow = version?.[i] || {}
            const comparisonRow = comparison?.[i] || {}

            let fields: ClientFieldConfig[] = []

            if (field.type === 'array' && 'fields' in field.fieldComponentProps)
              fields = field.fieldComponentProps.fields

            if (field.type === 'blocks') {
              fields = [
                // {
                //   name: 'blockType',
                //   label: i18n.t('fields:blockType'),
                //   type: 'text',
                // },
              ]

              if (versionRow?.blockType === comparisonRow?.blockType) {
                const matchedBlock = ('blocks' in field.fieldComponentProps &&
                  field.fieldComponentProps.blocks?.find(
                    (block) => block.slug === versionRow?.blockType,
                  )) || {
                  fields: [],
                }

                fields = [...fields, ...matchedBlock.fields]
              } else {
                const matchedVersionBlock = ('blocks' in field.fieldComponentProps &&
                  field.fieldComponentProps.blocks?.find(
                    (block) => block.slug === versionRow?.blockType,
                  )) || {
                  fields: [],
                }

                const matchedComparisonBlock = ('blocks' in field.fieldComponentProps &&
                  field.fieldComponentProps.blocks?.find(
                    (block) => block.slug === comparisonRow?.blockType,
                  )) || {
                  fields: [],
                }

                fields = getUniqueListBy<ClientFieldConfig>(
                  [...fields, ...matchedVersionBlock.fields, ...matchedComparisonBlock.fields],
                  'name',
                )
              }
            }

            return (
              <div className={`${baseClass}__wrap`} key={i}>
                <RenderFieldsToDiff
                  comparison={comparisonRow}
                  diffComponents={diffComponents}
                  fieldPermissions={permissions}
                  fields={fields}
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
            label:
              'labels' in field.fieldComponentProps && field.fieldComponentProps.labels?.plural
                ? getTranslation(field.fieldComponentProps.labels.plural, i18n)
                : i18n.t('general:rows'),
          })}
        </div>
      )}
    </div>
  )
}

export default Iterable
