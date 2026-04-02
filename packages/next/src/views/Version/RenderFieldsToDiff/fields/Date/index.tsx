'use client'
import type { DateFieldDiffClientComponent } from 'payload'

import {
  escapeDiffHTML,
  FieldDiffContainer,
  getHTMLDiffComponents,
  unescapeDiffHTML,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import React from 'react'

import './index.scss'

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

  const escapedFromDate = escapeDiffHTML(formattedFromDate)
  const escapedToDate = escapeDiffHTML(formattedToDate)

  const { From, To } = getHTMLDiffComponents({
    fromHTML:
      `<div class="${baseClass}" data-enable-match="true" data-date="${escapedFromDate}"><p>` +
      escapedFromDate +
      '</p></div>',
    postProcess: unescapeDiffHTML,
    toHTML:
      `<div class="${baseClass}" data-enable-match="true" data-date="${escapedToDate}"><p>` +
      escapedToDate +
      '</p></div>',
    tokenizeByCharacter: false,
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
