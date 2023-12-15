import type { DiffMethod } from 'react-diff-viewer-continued'

import React from 'react'

import type { Props } from './types'

import { fieldAffectsData, fieldHasSubFields } from '../../../../../fields/config/types'
import Nested from './fields/Nested'
import { diffMethods } from './fields/diffMethods'
import './index.scss'

const baseClass = 'render-field-diffs'

const RenderFieldsToDiff: React.FC<Props> = ({
  comparison,
  fieldComponents,
  fieldPermissions,
  fields,
  locales,
  version,
}) => (
  <div className={baseClass}>
    {fields.map((field, i) => {
      const Component = fieldComponents[field.type]

      const isRichText = field.type === 'richText'
      const diffMethod: DiffMethod = diffMethods[field.type] || 'CHARS'

      if (Component) {
        if (fieldAffectsData(field)) {
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

          if (field.localized) {
            return (
              <div className={`${baseClass}__field`} key={i}>
                {locales.map((locale, index) => {
                  const versionLocaleValue = versionValue?.[locale]
                  const comparisonLocaleValue = comparisonValue?.[locale]
                  return (
                    <div className={`${baseClass}__locale`} key={[locale, index].join('-')}>
                      <div className={`${baseClass}__locale-value`}>
                        <Component
                          comparison={comparisonLocaleValue}
                          diffMethod={diffMethod}
                          field={field}
                          fieldComponents={fieldComponents}
                          isRichText={isRichText}
                          locale={locale}
                          locales={locales}
                          permissions={subFieldPermissions}
                          version={versionLocaleValue}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }

          return (
            <div className={`${baseClass}__field`} key={i}>
              <Component
                comparison={comparisonValue}
                diffMethod={diffMethod}
                field={field}
                fieldComponents={fieldComponents}
                isRichText={isRichText}
                locales={locales}
                permissions={subFieldPermissions}
                version={versionValue}
              />
            </div>
          )
        }

        if (field.type === 'tabs') {
          const Tabs = fieldComponents.tabs

          return (
            <Tabs
              comparison={comparison}
              field={field}
              fieldComponents={fieldComponents}
              key={i}
              locales={locales}
              version={version}
            />
          )
        }

        // At this point, we are dealing with a `row` or similar
        if (fieldHasSubFields(field)) {
          return (
            <Nested
              comparison={comparison}
              disableGutter
              field={field}
              fieldComponents={fieldComponents}
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

export default RenderFieldsToDiff
