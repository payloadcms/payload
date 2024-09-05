'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import RenderFieldsToDiff from '../../index.js'
import Label from '../../Label/index.js'
import './index.scss'

const baseClass = 'nested-diff'

const Nested: React.FC<DiffComponentProps> = ({
  comparison,
  diffComponents,
  disableGutter = false,
  field,
  fields,
  i18n,
  locale,
  locales,
  modifiedOnly,
  permissions,
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
      <div
        className={[`${baseClass}__wrap`, !disableGutter && `${baseClass}__wrap--gutter`]
          .filter(Boolean)
          .join(' ')}
      >
        <RenderFieldsToDiff
          comparison={comparison}
          diffComponents={diffComponents}
          fieldPermissions={permissions}
          fields={fields}
          i18n={i18n}
          locales={locales}
          modifiedOnly
          version={version}
        />
      </div>
    </div>
  )
}

export default Nested
