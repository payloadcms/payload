'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import './index.scss'

import type { DiffComponentProps } from '../types.js'

import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderFieldsToDiff } from '../../index.js'

const baseClass = 'group-diff'

export const Group: React.FC<DiffComponentProps> = ({
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
      <DiffCollapser
        comparison={comparison}
        fields={fields}
        label={
          'label' in field &&
          field.label &&
          typeof field.label !== 'function' && (
            <span>
              {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
              {getTranslation(field.label, i18n)}
            </span>
          )
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
