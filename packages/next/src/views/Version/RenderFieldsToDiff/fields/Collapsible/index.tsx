'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderFieldsToDiff } from '../../index.js'

const baseClass = 'collapsible-diff'

export const Collapsible: React.FC<DiffComponentProps> = ({
  comparison,
  diffComponents,
  field,
  fieldPermissions,
  fields,
  i18n,
  locales,
  version,
}) => {
  return (
    <div className={baseClass}>
      <DiffCollapser
        comparison={comparison}
        fields={fields}
        label={
          'label' in field &&
          field.label &&
          typeof field.label !== 'function' && <span>{getTranslation(field.label, i18n)}</span>
        }
        locales={locales}
        version={version}
      >
        <RenderFieldsToDiff
          comparison={comparison}
          diffComponents={diffComponents}
          fieldPermissions={fieldPermissions}
          fields={fields}
          i18n={i18n}
          locales={locales}
          version={version}
        />
      </DiffCollapser>
    </div>
  )
}
