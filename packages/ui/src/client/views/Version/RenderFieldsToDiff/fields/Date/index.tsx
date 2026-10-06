'use client'
import type { DateFieldDiffClientProps } from 'payload'

import React from 'react'

import { FieldDiffContainer } from '../../../../../../shared/elements/FieldDiffContainer/index.js'
import {
  escapeDiffHTML,
  getHTMLDiffComponents,
  unescapeDiffHTML,
} from '../../../../../../shared/elements/HTMLDiff/index.js'
import { formatDate } from '../../../../../../shared/utilities/formatDocTitle/formatDateTitle.js'
import { useConfig } from '../../../../../providers/Config/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'date-diff'

export const DateDiffComponent: React.FC<DateFieldDiffClientProps> = ({
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
