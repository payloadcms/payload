'use client'

import React from 'react'

import type { VersionField } from '../buildVersionState.js'

import { diffComponents as _diffComponents } from './fields/index.js'
import './index.scss'

const baseClass = 'render-field-diffs'

export const RenderFieldsToDiff: React.FC<{
  fields: VersionField[]
}> = ({ fields }) => {
  return (
    <div className={baseClass}>
      {fields?.map((field, fieldIndex) => {
        if (field.CustomComponentByLocale) {
          const LocaleComponents: React.ReactNode[] = []
          for (const [locale, Component] of Object.entries(field.CustomComponentByLocale)) {
            LocaleComponents.push(
              <div className={`${baseClass}__locale`} key={[locale, fieldIndex].join('-')}>
                <div className={`${baseClass}__locale-value`}>{Component}</div>
              </div>,
            )
          }
          return (
            <div className={`${baseClass}__field`} key={fieldIndex}>
              {LocaleComponents}
            </div>
          )
        } else if (field.CustomComponent) {
          return (
            <div className={`${baseClass}__field field__${field.type}`} key={fieldIndex}>
              {field.CustomComponent}
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
