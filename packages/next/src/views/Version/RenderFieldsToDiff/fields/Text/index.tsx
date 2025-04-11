'use client'
import type { TextFieldDiffClientComponent } from 'payload'

import { FieldDiffContainer, getHTMLDiffComponents, useTranslation } from '@payloadcms/ui'

import './index.scss'

import React from 'react'

const baseClass = 'text-diff'

export const Text: TextFieldDiffClientComponent = ({
  comparisonValue: valueFrom,
  field,
  locale,
  versionValue: valueTo,
}) => {
  const { i18n } = useTranslation()

  let placeholder = ''

  if (valueTo == valueFrom) {
    placeholder = `<span class="html-diff-no-value">${i18n.t('general:noValue')}<span>`
  }

  const renderedValueTo: string =
    typeof valueTo === 'string'
      ? valueTo
      : valueTo
        ? `<pre>${JSON.stringify(valueTo, null, 2)}</pre>`
        : placeholder
  const renderedValueFrom =
    typeof valueFrom === 'string'
      ? valueFrom
      : valueFrom
        ? `<pre>${JSON.stringify(valueFrom, null, 2)}</pre>`
        : placeholder

  const { From, To } = getHTMLDiffComponents({
    fromHTML: '<p>' + renderedValueFrom + '</p>',
    toHTML: '<p>' + renderedValueTo + '</p>',
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
      To={To}
    />
  )
}
