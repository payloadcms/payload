'use client'
import type { TextFieldDiffClientComponent } from 'payload'

import React from 'react'

import { FieldDiffContainer } from '../../../../../elements/FieldDiffContainer/index.js'
import {
  escapeDiffHTML,
  getHTMLDiffComponents,
  unescapeDiffHTML,
} from '../../../../../elements/HTMLDiff/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'text-diff'

function formatValue(value: unknown): {
  tokenizeByCharacter: boolean
  value: string | undefined
} {
  if (typeof value === 'string') {
    return { tokenizeByCharacter: true, value: escapeDiffHTML(value) }
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
      value: `<pre>${escapeDiffHTML(JSON.stringify(value, null, 2))}</pre>`,
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
  const { i18n, t } = useTranslation()

  let placeholder = ''

  if (valueTo === valueFrom) {
    placeholder = `<span class="html-diff-no-value"></span>`
  }

  const NoValue = <div className="diff-no-value">{t('general:noValue')}</div>

  const formattedValueFrom = formatValue(valueFrom)
  const formattedValueTo = formatValue(valueTo)

  let tokenizeByCharacter = true
  if (formattedValueFrom.value?.length) {
    tokenizeByCharacter = formattedValueFrom.tokenizeByCharacter
  } else if (formattedValueTo.value?.length) {
    tokenizeByCharacter = formattedValueTo.tokenizeByCharacter
  }

  const fromHTML = formattedValueFrom.value ?? placeholder
  const toHTML = formattedValueTo.value ?? placeholder

  const { From: DiffFrom, To: DiffTo } = getHTMLDiffComponents({
    fromHTML: `<p>${fromHTML}</p>`,
    postProcess: unescapeDiffHTML,
    toHTML: `<p>${toHTML}</p>`,
    tokenizeByCharacter,
  })

  const From = fromHTML ? DiffFrom : NoValue
  const To = toHTML ? DiffTo : NoValue

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
