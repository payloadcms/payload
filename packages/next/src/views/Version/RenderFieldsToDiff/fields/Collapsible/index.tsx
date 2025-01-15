'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { DiffComponentProps } from '../types.js'

import { FieldDiffCollapser } from '../../FieldDiffCollapser/index.js'
import RenderFieldsToDiff from '../../index.js'

const baseClass = 'collapsible-diff'

const Collapsible: React.FC<DiffComponentProps> = ({
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
      <FieldDiffCollapser
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
      </FieldDiffCollapser>
    </div>
  )
}

export default Collapsible
