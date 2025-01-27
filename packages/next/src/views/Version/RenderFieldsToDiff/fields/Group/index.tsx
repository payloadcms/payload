'use client'
import type { GroupFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import './index.scss'

import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { DiffComponentProps } from '../../types.js'

import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderFieldsToDiff } from '../../index.js'

const baseClass = 'group-diff'

export const Group: React.FC<DiffComponentProps<GroupFieldClient>> = ({
  comparisonValue,
  field,
  fields,
  locale,
  locales,
  versionField,
  versionValue,
}) => {
  const { i18n } = useTranslation()

  return (
    <div className={baseClass}>
      <DiffCollapser
        comparison={comparisonValue}
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
        version={versionValue}
      >
        <RenderFieldsToDiff fields={versionField.fields} />
      </DiffCollapser>
    </div>
  )
}
