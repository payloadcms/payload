'use client'
import type { DiffMethod } from 'react-diff-viewer-continued'

import { fieldAffectsData } from 'payload/shared'
import React from 'react'

import type { diffComponents as _diffComponents } from './fields/index.js'
import type { FieldDiffProps, Props } from './types.js'

import { diffMethods } from './fields/diffMethods.js'
import Nested from './fields/Nested/index.js'
import './index.scss'

const baseClass = 'render-field-diffs'

const RenderFieldsToDiff: React.FC<Props> = ({
  comparison,
  diffComponents: __diffComponents,
  fieldPermissions,
  fields,
  i18n,
  locales,
  version,
}) => {
  // typing it as `as typeof _diffComponents` here ensures the TField generics of DiffComponentProps are respected.
  // Without it, you could pass a UI field to the Tabs component, without it erroring
  const diffComponents: typeof _diffComponents = __diffComponents as typeof _diffComponents
  return (
    <div className={baseClass}>
      {fields?.map((field, i) => {
        if ('name' in field && field.name === 'id') {
          return null
        }

        const Component = diffComponents[field.type]

        const isRichText = field.type === 'richText'
        const diffMethod: DiffMethod = diffMethods[field.type] || 'CHARS'

        if (Component) {
          if (fieldAffectsData(field)) {
            const fieldName = field.name
            const valueIsObject = field.type === 'code' || field.type === 'json'

            const versionValue = valueIsObject
              ? JSON.stringify(version?.[fieldName])
              : version?.[fieldName]

            const comparisonValue = valueIsObject
              ? JSON.stringify(comparison?.[fieldName])
              : comparison?.[fieldName]

            const hasPermission = fieldPermissions?.[fieldName]?.read?.permission

            const subFieldPermissions = fieldPermissions?.[fieldName]?.fields

            if (hasPermission === false) {
              return null
            }

            const baseCellProps: FieldDiffProps = {
              comparison: comparisonValue,
              diffComponents,
              diffMethod,
              field,
              fieldPermissions: subFieldPermissions,
              fields: 'fields' in field ? field?.fields : fields,
              i18n,
              isRichText,
              locales,
              version: versionValue,
            }

            if (field.localized) {
              return (
                <div className={`${baseClass}__field`} key={i}>
                  {locales.map((locale, index) => {
                    const versionLocaleValue = versionValue?.[locale]
                    const comparisonLocaleValue = comparisonValue?.[locale]

                    const cellProps = {
                      ...baseCellProps,
                      comparison: comparisonLocaleValue,
                      version: versionLocaleValue,
                    }

                    return (
                      <div className={`${baseClass}__locale`} key={[locale, index].join('-')}>
                        <div className={`${baseClass}__locale-value`}>
                          <Component {...cellProps} locale={locale} />
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

          if (field.type === 'tabs' && 'tabs' in field) {
            const Tabs = diffComponents.tabs

            return (
              <Tabs
                comparison={comparison}
                diffComponents={diffComponents}
                field={field}
                fields={[]}
                i18n={i18n}
                key={i}
                locales={locales}
                version={version}
              />
            )
          }

          // At this point, we are dealing with a `row`, etc
          if ('fields' in field) {
            return (
              <Component
                comparison={comparison}
                diffComponents={diffComponents}
                disableGutter
                field={field}
                fields={field.fields}
                i18n={i18n}
                key={i}
                locales={locales}
                permissions={fieldPermissions}
                version={version}
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
