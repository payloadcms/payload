const baseClass = 'render-field-diffs'
import type { VersionField } from 'payload'

import './index.scss'

export const RenderVersionFieldsToDiff = ({
  versionFields,
}: {
  versionFields: VersionField[]
}): React.ReactNode => {
  return (
    <div className={baseClass}>
      {versionFields?.map((field, fieldIndex) => {
        if (field.fieldByLocale) {
          const LocaleComponents: React.ReactNode[] = []
          for (const [locale, baseField] of Object.entries(field.fieldByLocale)) {
            LocaleComponents.push(
              <div className={`${baseClass}__locale`} key={[locale, fieldIndex].join('-')}>
                <div className={`${baseClass}__locale-value`}>{baseField.CustomComponent}</div>
              </div>,
            )
          }
          return (
            <div className={`${baseClass}__field`} key={fieldIndex}>
              {LocaleComponents}
            </div>
          )
        } else if (field.field) {
          return (
            <div className={`${baseClass}__field field__${field.type}`} key={fieldIndex}>
              {field.field.CustomComponent}
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
