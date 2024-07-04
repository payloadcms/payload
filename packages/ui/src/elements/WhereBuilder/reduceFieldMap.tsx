'use client'
import React, { Fragment, type JSX } from 'react'

import type { FieldMap, MappedField, MappedTab } from '../../utilities/buildComponentMap.js'

import { createNestedClientFieldPath } from '../../forms/Form/createNestedFieldPath.js'
import fieldTypes from './field-types.js'

export const reduceFieldMap = (
  fieldMap: FieldMap,
  i18n,
  labelPrefix?: JSX.Element,
  pathPrefix?: string,
  locale?: string,
) => {
  return fieldMap.reduce((reduced, field) => {
    if (field.disableListFilter) return reduced

    if (field.type === 'tabs' && 'tabs' in field.fieldComponentProps) {
      const tabs = field.fieldComponentProps.tabs
      tabs.forEach((tab) => {
        const newPathPrefix =
          pathPrefix && tab.name ? `${pathPrefix}.${tab.name}` : tab.name ? tab.name : pathPrefix
        const newLabelPrefix = tab.name
          ? combineLabel({ field: tab, locale, prefix: labelPrefix }) || labelPrefix
          : labelPrefix
        if (tab.fieldMap) {
          reduced.push(...reduceFieldMap(tab.fieldMap, i18n, newLabelPrefix, newPathPrefix, locale))
        }
      })
      return reduced
    }

    if (field.type === 'group' && 'fieldMap' in field.fieldComponentProps) {
      const newPathPrefix = pathPrefix ? `${pathPrefix}.${field.name}` : field.name
      const newLabelPrefix = combineLabel({ field, locale, prefix: labelPrefix }) || labelPrefix
      reduced.push(
        ...reduceFieldMap(
          field.fieldComponentProps.fieldMap,
          i18n,
          newLabelPrefix,
          newPathPrefix,
          locale,
        ),
      )
      return reduced
    }

    if (field.type === 'row' && 'fieldMap' in field.fieldComponentProps) {
      reduced.push(
        ...reduceFieldMap(
          field.fieldComponentProps.fieldMap,
          i18n,
          labelPrefix,
          pathPrefix,
          locale,
        ),
      )
      return reduced
    }

    if (typeof fieldTypes[field.type] === 'object') {
      const operatorKeys = new Set()
      const operators = fieldTypes[field.type].operators.reduce((acc, operator) => {
        if (!operatorKeys.has(operator.value)) {
          operatorKeys.add(operator.value)
          acc.push({
            ...operator,
            label: i18n.t(`operators:${operator.label}`),
          })
        }
        return acc
      }, [])

      const formattedLabel = combineLabel({
        field,
        locale,
        prefix: labelPrefix,
      })

      const formattedValue = pathPrefix
        ? createNestedClientFieldPath(pathPrefix, field)
        : field.name

      const formattedField = {
        label: formattedLabel,
        value: formattedValue,
        ...fieldTypes[field.type],
        operators,
        props: {
          ...field,
          ...(field?.cellComponentProps || {}),
        },
      }

      reduced.push(formattedField)
      return reduced
    }

    return reduced
  }, [])
}

const combineLabel = ({
  field,
  locale,
  prefix,
}: {
  field?: MappedField | MappedTab
  locale?: string
  prefix?: JSX.Element
}): JSX.Element => {
  const CustomLabelToRender =
    field &&
    'fieldComponentProps' in field &&
    'CustomLabel' in field.fieldComponentProps &&
    field.fieldComponentProps.CustomLabel !== undefined
      ? field.fieldComponentProps.CustomLabel
      : null

  const LabelData =
    field &&
    'fieldComponentProps' in field &&
    'label' in field.fieldComponentProps &&
    field.fieldComponentProps.label
      ? field.fieldComponentProps.label
      : field && 'label' in field
        ? field.label
        : null

  const DefaultLabelToRender =
    LabelData && typeof LabelData === 'object'
      ? LabelData[locale]
      : LabelData && typeof LabelData === 'string'
        ? LabelData
        : null

  const LabelToRender = CustomLabelToRender || DefaultLabelToRender

  if (!LabelToRender) return null

  return (
    <Fragment>
      {prefix && (
        <Fragment>
          <span style={{ display: 'inline-block' }}>{prefix}</span>
          {' > '}
        </Fragment>
      )}
      <span style={{ display: 'inline-block' }}>{LabelToRender}</span>
    </Fragment>
  )
}
