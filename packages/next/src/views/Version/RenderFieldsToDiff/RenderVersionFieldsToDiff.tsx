'use client'
const baseClass = 'render-field-diffs'
import type { VersionField } from 'payload'

import './index.scss'

import { ShimmerEffect } from '@payloadcms/ui'
import React, { Fragment, useEffect } from 'react'

export const RenderVersionFieldsToDiff = ({
  versionFields,
}: {
  versionFields: VersionField[]
}): React.ReactNode => {
  const [hasMounted, setHasMounted] = React.useState(false)

  // defer rendering until after the first mount as the CSS is loaded with Emotion
  // this will ensure that the CSS is loaded before rendering the diffs and prevent CLS
  useEffect(() => {
    setHasMounted(true)
  }, [])

  return (
    <div className={baseClass}>
      {!hasMounted ? (
        <Fragment>
          <ShimmerEffect height="8rem" width="100%" />
        </Fragment>
      ) : (
        versionFields?.map((field, fieldIndex) => {
          if (field.fieldByLocale) {
            const LocaleComponents: React.ReactNode[] = []
            for (const [locale, baseField] of Object.entries(field.fieldByLocale)) {
              LocaleComponents.push(
                <div
                  className={`${baseClass}__locale`}
                  data-field-path={baseField.path}
                  data-locale={locale}
                  key={[locale, fieldIndex].join('-')}
                >
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
              <div
                className={`${baseClass}__field field__${field.field.type}`}
                data-field-path={field.field.path}
                key={fieldIndex}
              >
                {field.field.CustomComponent}
              </div>
            )
          }

          return null
        })
      )}
    </div>
  )
}
