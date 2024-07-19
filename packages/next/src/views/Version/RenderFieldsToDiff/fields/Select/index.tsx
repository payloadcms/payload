import type { SelectFieldProps } from '@payloadcms/ui'
import type { MappedField } from '@payloadcms/ui/utilities/buildComponentMap'
import { getSelectedOptionLabels } from '@payloadcms/ui'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { Props } from '../types.js'

import Label from '../../Label/index.js'
import { diffStyles } from '../styles.js'
import { DiffViewer } from './DiffViewer/index.js'
import './index.scss'

const baseClass = 'select-diff'

const Select: React.FC<
  {
    field: MappedField & SelectFieldProps
  } & Omit<Props, 'field'>
> = ({ comparison, diffMethod, field, i18n, locale, version }) => {
  let placeholder = ''

  if (version === comparison) placeholder = `[${i18n.t('general:noValue')}]`

  const options = 'options' in field.fieldComponentProps && field.fieldComponentProps.options

  const comparisonToRender =
    typeof comparison !== 'undefined'
      ? getSelectedOptionLabels({
          selectedOptions: Array.isArray(comparison) ? comparison : [comparison],
          options,
          i18n,
        }).join(', ')
      : placeholder

  const versionToRender =
    typeof version !== 'undefined'
      ? getSelectedOptionLabels({
          selectedOptions: Array.isArray(version) ? version : [version],
          options,
          i18n,
        }).join(', ')
      : placeholder

  return (
    <div className={baseClass}>
      <Label>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {'label' in field && getTranslation(field.label || '', i18n)}
      </Label>
      <DiffViewer
        comparisonToRender={comparisonToRender}
        diffMethod={diffMethod}
        diffStyles={diffStyles}
        placeholder={placeholder}
        versionToRender={versionToRender}
      />
    </div>
  )
}

export default Select
