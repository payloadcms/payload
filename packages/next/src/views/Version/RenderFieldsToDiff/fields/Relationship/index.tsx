import type { RelationshipFieldDiffServerComponent } from 'payload'

import { FieldDiffContainer, getHTMLDiffComponents } from '@payloadcms/ui/rsc'
import React from 'react'

import './index.scss'
import { generateLabelFromValue } from './generateLabelFromValue.js'

const baseClass = 'relationship-diff'

export const Relationship: RelationshipFieldDiffServerComponent = ({
  comparisonValue: valueFrom,
  field,
  i18n,
  locale,
  nestingLevel,
  parentIsLocalized,
  req,
  versionValue: valueTo,
}) => {
  const placeholder = `[${i18n.t('general:noValue')}]`

  let renderedValueTo: string | undefined = placeholder
  let renderedValueFrom: string | undefined = placeholder

  const hasMany = 'hasMany' in field && field.hasMany
  const polymorphic = Array.isArray(field.relationTo)

  if (valueTo) {
    if (hasMany && Array.isArray(valueTo)) {
      renderedValueTo =
        valueTo
          .map((val) =>
            generateLabelFromValue({ field, locale, parentIsLocalized, req, value: val }),
          )
          .join(', ') || placeholder
    } else {
      renderedValueTo =
        generateLabelFromValue({ field, locale, parentIsLocalized, req, value: valueTo }) ||
        placeholder
    }
  }

  if (valueFrom) {
    if (hasMany && Array.isArray(valueFrom)) {
      renderedValueFrom =
        valueFrom
          .map((val) =>
            generateLabelFromValue({ field, locale, parentIsLocalized, req, value: val }),
          )
          .join(', ') || placeholder
    } else {
      renderedValueFrom =
        generateLabelFromValue({
          field,
          locale,
          parentIsLocalized,
          req,
          value: valueFrom,
        }) || placeholder
    }
  }

  const { From, To } = getHTMLDiffComponents({
    fromHTML: '<p>' + renderedValueFrom + '</p>',
    toHTML: '<p>' + renderedValueTo + '</p>',
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
