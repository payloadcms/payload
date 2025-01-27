'use client'

import type { VersionField } from 'payload'

import React from 'react'

import './index.scss'
import { diffComponents as _diffComponents } from './fields/index.js'

const baseClass = 'render-field-diffs'

export const RenderFieldsToDiff: React.FC<{
  fields: VersionField[]
}> = ({ fields }) => {
  return (
    <div className={baseClass}>
      {fields?.map((field, fieldIndex) => {
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
