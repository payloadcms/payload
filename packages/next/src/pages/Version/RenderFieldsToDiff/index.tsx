'use client'
import type { DiffMethod } from 'react-diff-viewer-continued'

import React from 'react'

import type { Props, FieldDiffProps } from './types'

import Nested from './fields/Nested'
import { diffMethods } from './fields/diffMethods'

import './index.scss'

const baseClass = 'render-field-diffs'

const RenderFieldsToDiff: React.FC<Props> = ({
  comparison,
  fieldPermissions,
  fieldMap,
  locales,
  version,
  locale,
  i18n,
  fieldComponents,
}) => {
  return (
    <div className={baseClass}>
      {fieldMap?.map((field, i) => {
        const Component = fieldComponents[field.type]

        const isRichText = field.type === 'richText'
        const diffMethod: DiffMethod = diffMethods[field.type] || 'CHARS'

        if (Component) {
          if (field.isFieldAffectingData) {
            const valueIsObject = field.type === 'code' || field.type === 'json'

            const versionValue = valueIsObject
              ? JSON.stringify(version?.[field.name])
              : version?.[field.name]

            const comparisonValue = valueIsObject
              ? JSON.stringify(comparison?.[field.name])
              : comparison?.[field.name]

            const hasPermission = fieldPermissions?.[field.name]?.read?.permission

            const subFieldPermissions = fieldPermissions?.[field.name]?.fields

            if (hasPermission === false) return null

            const baseCellProps: FieldDiffProps = {
              // diffMethod: diffMethod,
              field,
              // isRichText: isRichText,
              locale: locale,
              locales: locales,
              // permissions: subFieldPermissions,
              i18n,
              fieldMap: 'subfields' in field ? field.subfields : fieldMap,
              fieldComponents,
            }

            if (field.localized) {
              return (
                <div className={`${baseClass}__field`} key={i}>
                  {locales.map((locale, index) => {
                    const versionLocaleValue = versionValue?.[locale]
                    const comparisonLocaleValue = comparisonValue?.[locale]

                    const cellProps = {
                      ...baseCellProps,
                      version: versionLocaleValue,
                      comparison: comparisonLocaleValue,
                    }

                    return (
                      <div className={`${baseClass}__locale`} key={[locale, index].join('-')}>
                        <div className={`${baseClass}__locale-value`}>
                          <Component {...cellProps} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }

            return (
              <div className={`${baseClass}__field`} key={i}>
                <Component {...baseCellProps} />
              </div>
            )
          }

          if (field.type === 'tabs') {
            const Tabs = fieldComponents.tabs

            return (
              <Tabs
                comparison={comparison}
                key={i}
                locales={locales}
                version={version}
                locale={locale}
                i18n={i18n}
                field={field}
                fieldMap={field.subfields}
                fieldComponents={fieldComponents}
              />
            )
          }

          // At this point, we are dealing with a `row`, etc
          if (field.subfields) {
            return (
              <Nested
                comparison={comparison}
                disableGutter
                field={field}
                fieldMap={field.subfields}
                key={i}
                locales={locales}
                permissions={fieldPermissions}
                version={version}
                locale={locale}
                i18n={i18n}
                fieldComponents={fieldComponents}
              />
            )
          }
        }

        return null
      })}
    </div>
  )
}

export default RenderFieldsToDiff
