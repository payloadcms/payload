'use client'
import type { DateFieldDiffClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  FieldDiffContainer,
  FieldDiffLabel,
  getHTMLDiffComponents,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'

import './index.scss'

import React from 'react'

const baseClass = 'date-diff'

export const DateDiffComponent: DateFieldDiffClientComponent = ({
  comparisonValue: valueFrom,
  field,
  locale,
  nestingLevel,
  versionValue: valueTo,
}) => {
  const { i18n } = useTranslation()
  const {
    config: {
      admin: { dateFormat },
    },
  } = useConfig()

  const formattedFromDate = valueFrom
    ? formatDate({
        date: typeof valueFrom === 'string' ? new Date(valueFrom) : (valueFrom as Date),
        i18n,
        pattern: dateFormat,
      })
    : ''

  const formattedToDate = valueTo
    ? formatDate({
        date: typeof valueTo === 'string' ? new Date(valueTo) : (valueTo as Date),
        i18n,
        pattern: dateFormat,
      })
    : ''

  const { From, To } = getHTMLDiffComponents({
    fromHTML: '<p>' + formattedFromDate + '</p>',
    toHTML: '<p>' + formattedToDate + '</p>',
    tokenizeByCharacter: true,
  })

  return (
    <FieldDiffContainer
      className={baseClass}
      From={From}
      i18n={i18n}
      label={{
        label: field.label,
        locale,
      }}
      nestingLevel={nestingLevel}
      To={To}
    />
  )
}
