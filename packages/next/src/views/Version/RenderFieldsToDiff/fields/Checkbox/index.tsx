'use client'
import type { CheckboxFieldDiffClientComponent } from 'payload'

import { CheckIcon, FieldDiffContainer, useTranslation } from '@payloadcms/ui'
import React from 'react'

import './index.css'

const baseClass = 'checkbox-diff'

const CheckboxIndicator: React.FC<{
  checked: boolean
  variant?: 'create' | 'default' | 'delete'
}> = ({ checked, variant = 'default' }) => {
  const classNames = [
    `${baseClass}__indicator`,
    `${baseClass}__indicator--${variant}`,
    checked && `${baseClass}__indicator--checked`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classNames}>
      <span className={`${baseClass}__icon`}>
        <CheckIcon size={16} />
      </span>
    </span>
  )
}

export const Checkbox: CheckboxFieldDiffClientComponent = ({
  comparisonValue: valueFrom,
  field,
  locale,
  nestingLevel,
  versionValue: valueTo,
}) => {
  const { i18n } = useTranslation()

  const checkedFrom = Boolean(valueFrom)
  const checkedTo = Boolean(valueTo)
  const hasChanged = checkedFrom !== checkedTo

  const fromVariant = hasChanged ? 'delete' : 'default'
  const toVariant = hasChanged ? 'create' : 'default'

  const From = (
    <div className={`${baseClass}__value ${baseClass}__value--${fromVariant}`}>
      <CheckboxIndicator checked={checkedFrom} variant={fromVariant} />
      <span className={`${baseClass}__label ${baseClass}__label--${fromVariant}`}>
        {checkedFrom ? 'Checked' : 'Unchecked'}
      </span>
    </div>
  )

  const To = (
    <div className={`${baseClass}__value ${baseClass}__value--${toVariant}`}>
      <CheckboxIndicator checked={checkedTo} variant={toVariant} />
      <span className={`${baseClass}__label ${baseClass}__label--${toVariant}`}>
        {checkedTo ? 'Checked' : 'Unchecked'}
      </span>
    </div>
  )

  return (
    <FieldDiffContainer
      className={baseClass}
      From={From}
      i18n={i18n}
      label={{ label: field.label, locale }}
      nestingLevel={nestingLevel}
      To={To}
    />
  )
}
