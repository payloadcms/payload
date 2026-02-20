'use client'
import type { TextFieldDiffClientComponent } from 'payload'

import { FieldDiffContainer, getHTMLDiffComponents, useTranslation } from '@payloadcms/ui'

import './index.scss'

import React from 'react'

const baseClass = 'text-diff'

function formatValue(value: unknown): {
  tokenizeByCharacter: boolean
  value: string
} {
  if (typeof value === 'string') {
    return { tokenizeByCharacter: true, value }
  }
  if (typeof value === 'number') {
    return {
      tokenizeByCharacter: true,
      value: String(value),
    }
  }
  if (typeof value === 'boolean') {
    return {
      tokenizeByCharacter: false,
      value: String(value),
    }
  }

  if (value && typeof value === 'object') {
    return {
      tokenizeByCharacter: false,
      value: `<pre>${JSON.stringify(value, null, 2)}</pre>`,
    }
  }

  return {
    tokenizeByCharacter: true,
    value: undefined,
  }
}

export const Text: TextFieldDiffClientComponent = ({
  comparisonValue: valueFrom,
  field,
  locale,
  nestingLevel,
  versionValue: valueTo,
}) => {
  const { i18n } = useTranslation()

  let placeholder = ''

  if (valueTo == valueFrom) {
    placeholder = `<span class="html-diff-no-value"><span>`
  }

  const formattedValueFrom = formatValue(valueFrom)
  const formattedValueTo = formatValue(valueTo)

  let tokenizeByCharacter = true
  if (formattedValueFrom.value?.length) {
    tokenizeByCharacter = formattedValueFrom.tokenizeByCharacter
  } else if (formattedValueTo.value?.length) {
    tokenizeByCharacter = formattedValueTo.tokenizeByCharacter
  }

  const renderedValueFrom = formattedValueFrom.value ?? placeholder
  const renderedValueTo: string = formattedValueTo.value ?? placeholder

  const { From, To } = getHTMLDiffComponents({
    fromHTML: '<p>' + renderedValueFrom + '</p>',
    toHTML: '<p>' + renderedValueTo + '</p>',
    tokenizeByCharacter,
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
