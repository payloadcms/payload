'use client'
import type { GroupFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import './index.scss'

import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { DiffComponentProps } from '../../types.js'

import { useSelectedLocales } from '../../../Default/SelectedLocalesContext.js'
import { DiffCollapser } from '../../DiffCollapser/index.js'
import { RenderFieldsToDiff } from '../../index.js'

const baseClass = 'group-diff'

export const Group: React.FC<DiffComponentProps<GroupFieldClient>> = ({
  baseVersionField,
  comparisonValue,
  field,
  locale,
  versionValue,
}) => {
  const { i18n } = useTranslation()
  const { selectedLocales } = useSelectedLocales()

  return (
    <div className={baseClass}>
      <DiffCollapser
        comparison={comparisonValue}
        fields={field.fields}
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
        locales={selectedLocales}
        version={versionValue}
      >
        <RenderFieldsToDiff fields={baseVersionField.fields} />
      </DiffCollapser>
    </div>
  )
}
