import type { I18nClient } from '@payloadcms/translations'
import type { SelectFieldProps } from '@payloadcms/ui'
import type { MappedField } from '@payloadcms/ui/utilities/buildComponentMap'
import type { Option, OptionObject, SelectField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { Props } from '../types.js'

import Label from '../../Label/index.js'
import { diffStyles } from '../styles.js'
import { DiffViewer } from './DiffViewer/index.js'
import './index.scss'

const baseClass = 'select-diff'

function getSelectedOptionValues(
  selectedOptions: string[],
  options: Option[],
  i18n: I18nClient,
): string[] {
  const uniqueSelectOptions = selectedOptions.reduce((acc: Set<string>, selectedOption) => {
    options.forEach((option) => {
      if (typeof option === 'string') {
        if (option === selectedOption) acc.add(getTranslation(option, i18n))
      } else if ('options' in option) {
        acc = new Set([...acc, ...getSelectedOptionValues(selectedOptions, option.options, i18n)])
      } else if (option.value === selectedOption) {
        acc.add(getTranslation(option.label, i18n))
      }
    })

    return acc
  }, new Set<string>())

  return [...uniqueSelectOptions]
}

const getTranslatedOptions = (
  options: (OptionObject | string)[] | OptionObject | string,
  i18n: I18nClient,
): string => {
  if (Array.isArray(options)) {
    return options
      .map((option) => (typeof option === 'string' ? option : getTranslation(option.label, i18n)))
      .join(', ')
  }

  return typeof options === 'string' ? options : getTranslation(options.label, i18n)
}

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
      ? getSelectedOptionValues(
          Array.isArray(comparison) ? comparison : [comparison],
          options,
          i18n,
        ).join(', ')
      : placeholder

  const versionToRender =
    typeof version !== 'undefined'
      ? getSelectedOptionValues(Array.isArray(version) ? version : [version], options, i18n).join(
          ', ',
        )
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
