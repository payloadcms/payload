'use client'
import type { I18nClient } from '@payloadcms/translations'
import type { OptionObject, SelectField, SelectFieldDiffClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import Label from '../../Label/index.js'
import './index.scss'
import { diffStyles } from '../styles.js'
import { DiffViewer } from './DiffViewer/index.js'

const baseClass = 'select-diff'

const getOptionsToRender = (
  value: string,
  options: SelectField['options'],
  hasMany: boolean,
): (OptionObject | string)[] | OptionObject | string => {
  if (hasMany && Array.isArray(value)) {
    return value.map(
      (val) =>
        options.find((option) => (typeof option === 'string' ? option : option.value) === val) ||
        String(val),
    )
  }
  return (
    options.find((option) => (typeof option === 'string' ? option : option.value) === value) ||
    String(value)
  )
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

export const Select: SelectFieldDiffClientComponent = ({
  comparisonValue,
  diffMethod,
  field,
  locale,
  versionValue,
}) => {
  const { i18n } = useTranslation()

  let placeholder = ''

  if (versionValue == comparisonValue) {
    placeholder = `[${i18n.t('general:noValue')}]`
  }

  const options = 'options' in field && field.options

  const comparisonToRender =
    typeof comparisonValue !== 'undefined'
      ? getTranslatedOptions(
          getOptionsToRender(
            typeof comparisonValue === 'string' ? comparisonValue : JSON.stringify(comparisonValue),
            options,
            field.hasMany,
          ),
          i18n,
        )
      : placeholder

  const versionToRender =
    typeof versionValue !== 'undefined'
      ? getTranslatedOptions(
          getOptionsToRender(
            typeof versionValue === 'string' ? versionValue : JSON.stringify(versionValue),
            options,
            field.hasMany,
          ),
          i18n,
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
