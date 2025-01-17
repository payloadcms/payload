'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import { RenderFieldsToDiff } from '../../index.js'
import Label from '../../Label/index.js'

const baseClass = 'row-diff'

export const Row: React.FC<DiffComponentProps> = ({
  comparison,
  diffComponents,
  field,
  fieldPermissions,
  fields,
  i18n,
  locale,
  locales,
  version,
}) => {
  return (
    <div className={baseClass}>
      {'label' in field && field.label && typeof field.label !== 'function' && (
        <Label>
          {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
          {getTranslation(field.label, i18n)}
        </Label>
      )}
      <RenderFieldsToDiff
        comparison={comparison}
        diffComponents={diffComponents}
        fieldPermissions={fieldPermissions}
        fields={fields}
        i18n={i18n}
        locales={locales}
        version={version}
      />
    </div>
  )
}
