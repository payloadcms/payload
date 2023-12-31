import type { i18n as Ii18n } from 'i18next'

import React from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { useTranslation } from 'react-i18next'

import type { OptionObject, SelectField } from '../../../../../../../fields/config/types'
import type { Props } from '../types'

import { getTranslation } from '../../../../../../../utilities/getTranslation'
import Label from '../../Label'
import { diffStyles } from '../styles'
import './index.scss'

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
  i18n: Ii18n,
): string => {
  if (Array.isArray(options)) {
    return options
      .map((option) => (typeof option === 'string' ? option : getTranslation(option.label, i18n)))
      .join(', ')
  }
  return typeof options === 'string' ? options : getTranslation(options.label, i18n)
}

const Select: React.FC<Props> = ({ comparison, diffMethod, field, locale, version }) => {
  let placeholder = ''
  const { i18n, t } = useTranslation('general')

  if (version === comparison) placeholder = `[${t('noValue')}]`

  const comparisonToRender =
    typeof comparison !== 'undefined'
      ? getTranslatedOptions(getOptionsToRender(comparison, field.options, field.hasMany), i18n)
      : placeholder
  const versionToRender =
    typeof version !== 'undefined'
      ? getTranslatedOptions(getOptionsToRender(version, field.options, field.hasMany), i18n)
      : placeholder

  return (
    <div className={baseClass}>
      <Label>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {getTranslation(field.label, i18n)}
      </Label>
      <ReactDiffViewer
        compareMethod={DiffMethod[diffMethod]}
        hideLineNumbers
        newValue={typeof versionToRender !== 'undefined' ? versionToRender : placeholder}
        oldValue={comparisonToRender}
        showDiffOnly={false}
        splitView
        styles={diffStyles}
      />
    </div>
  )
}

export default Select
