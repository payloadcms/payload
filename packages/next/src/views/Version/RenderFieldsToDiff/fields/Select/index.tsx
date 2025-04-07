'use client'
import type { I18nClient } from '@payloadcms/translations'
import type { Option, SelectField, SelectFieldDiffClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { FieldDiffLabel, useTranslation } from '@payloadcms/ui'
import React from 'react'

import './index.scss'
import { diffStyles } from '../styles.js'
import { DiffViewer } from './DiffViewer/index.js'

const baseClass = 'select-diff'

const getOptionsToRender = (
  value: string,
  options: SelectField['options'],
  hasMany: boolean,
): Option | Option[] => {
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

/**
 * Translates option labels while ensuring they are strings.
 * If `options.label` is a JSX element, it falls back to `options.value` because `DiffViewer`
 * expects all values to be strings.
 */
const getTranslatedOptions = (options: Option | Option[], i18n: I18nClient): string => {
  if (Array.isArray(options)) {
    return options
      .map((option) => {
        if (typeof option === 'string') {
          return option
        }
        const translatedLabel = getTranslation(option.label, i18n)

        // Ensure the result is a string, otherwise use option.value
        return typeof translatedLabel === 'string' ? translatedLabel : option.value
      })
      .join(', ')
  }

  if (typeof options === 'string') {
    return options
  }

  const translatedLabel = getTranslation(options.label, i18n)

  return typeof translatedLabel === 'string' ? translatedLabel : options.value
}

export const Select: SelectFieldDiffClientComponent = ({
  comparisonValue: valueFrom,
  diffMethod,
  field,
  locale,
  versionValue: valueTo,
}) => {
  const { i18n } = useTranslation()

  let placeholder = ''

  if (valueTo == valueFrom) {
    placeholder = `[${i18n.t('general:noValue')}]`
  }

  const options = 'options' in field && field.options

  const renderedValueFrom =
    typeof valueFrom !== 'undefined'
      ? getTranslatedOptions(
          getOptionsToRender(
            typeof valueFrom === 'string' ? valueFrom : JSON.stringify(valueFrom),
            options,
            field.hasMany,
          ),
          i18n,
        )
      : placeholder

  const renderedValueTo =
    typeof valueTo !== 'undefined'
      ? getTranslatedOptions(
          getOptionsToRender(
            typeof valueTo === 'string' ? valueTo : JSON.stringify(valueTo),
            options,
            field.hasMany,
          ),
          i18n,
        )
      : placeholder

  return (
    <div className={baseClass}>
      <FieldDiffLabel>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {'label' in field && getTranslation(field.label || '', i18n)}
      </FieldDiffLabel>
      <DiffViewer
        diffMethod={diffMethod}
        diffStyles={diffStyles}
        placeholder={placeholder}
        renderedValueFrom={renderedValueFrom}
        renderedValueTo={renderedValueTo}
      />
    </div>
  )
}
