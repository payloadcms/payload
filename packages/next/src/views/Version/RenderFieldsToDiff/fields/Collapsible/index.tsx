'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import FieldDiffCollapser from '../../FieldDiffCollapser/index.js'
import RenderFieldsToDiff from '../../index.js'

const baseClass = 'nested-diff'

const Collapsible: React.FC<DiffComponentProps> = ({
  comparison,
  diffComponents,
  disableGutter = false,
  field,
  fields,
  i18n,
  locale,
  locales,
  permissions,
  version,
}) => {
  return (
    <div className={baseClass}>
      <FieldDiffCollapser
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
      >
        <RenderFieldsToDiff
          comparison={comparison}
          diffComponents={diffComponents}
          fieldPermissions={permissions}
          fields={fields}
          i18n={i18n}
          locales={locales}
          version={version}
        />
      </FieldDiffCollapser>
    </div>
  )
}

export default Collapsible
