'use client'
import type { ClientTranslationKeys, I18nClient } from '@payloadcms/translations'
import type { ClientField, SanitizedFieldPermissions, SanitizedFieldsPermissions } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { fieldAffectsData, fieldIsHiddenOrDisabled, fieldIsID, tabHasName } from 'payload/shared'

import type { ReducedField } from '../elements/WhereBuilder/types.js'

import fieldTypes, { arrayOperators } from '../elements/WhereBuilder/field-types.js'
import { createNestedClientFieldPath } from '../forms/Form/createNestedClientFieldPath.js'
import { combineFieldLabel } from './combineFieldLabel.js'

type ReduceFieldOptionsArgs = {
  fieldPermissions?: SanitizedFieldPermissions | SanitizedFieldsPermissions
  fields: ClientField[]
  i18n: I18nClient
  labelPrefix?: string
  pathPrefix?: string
}

/**
 * Transforms a fields schema into a flattened array of fields with labels and values.
 * Used in the `WhereBuilder` component to render the fields in the dropdown.
 */
export const reduceFieldsToOptions = ({
  fieldPermissions,
  fields,
  i18n,
  labelPrefix,
  pathPrefix: pathPrefixFromArgs,
}: ReduceFieldOptionsArgs): ReducedField[] => {
  return fields.reduce((reduced, field) => {
    let pathPrefix = pathPrefixFromArgs
    // Do not filter out `field.admin.disableListFilter` fields here, as these should still render as disabled if they appear in the URL query
    // Filter out `virtual: true` fields since they are regular virtuals and not backed by a DB field
    if (
      (fieldIsHiddenOrDisabled(field) && !fieldIsID(field)) ||
      ('virtual' in field && field.virtual === true)
    ) {
      return reduced
    }

    // Handle virtual:string fields (virtual relationships, e.g. "post.title")
    if ('virtual' in field && typeof field.virtual === 'string') {
      pathPrefix = pathPrefix ? pathPrefix + '.' + field.virtual : field.virtual
      if (fieldAffectsData(field)) {
        // ignore virtual field names
        field.name = ''
      }
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      const tabs = field.tabs

      tabs.forEach((tab) => {
        if (typeof tab.label !== 'boolean') {
          const localizedTabLabel = getTranslation(tab.label, i18n)

          const labelWithPrefix = labelPrefix
            ? labelPrefix + ' > ' + localizedTabLabel
            : localizedTabLabel

          // Make sure we handle nested tabs
          const tabPathPrefix =
            tabHasName(tab) && tab.name
              ? pathPrefix
                ? pathPrefix + '.' + tab.name
                : tab.name
              : pathPrefix

          if (typeof localizedTabLabel === 'string') {
            reduced.push(
              ...reduceFieldsToOptions({
                fieldPermissions:
                  typeof fieldPermissions === 'boolean'
                    ? fieldPermissions
                    : tabHasName(tab) && tab.name
                      ? fieldPermissions[tab.name]?.fields || fieldPermissions[tab.name]
                      : fieldPermissions,
                fields: tab.fields,
                i18n,
                labelPrefix: labelWithPrefix,
                pathPrefix: tabPathPrefix,
              }),
            )
          }
        }
      })
      return reduced
    }

    // Rows cant have labels, so we need to handle them differently
    if (field.type === 'row' && 'fields' in field) {
      reduced.push(
        ...reduceFieldsToOptions({
          fieldPermissions,
          fields: field.fields,
          i18n,
          labelPrefix,
          pathPrefix,
        }),
      )
      return reduced
    }

    if (field.type === 'collapsible' && 'fields' in field) {
      const localizedTabLabel = getTranslation(field.label || '', i18n)

      const labelWithPrefix = labelPrefix
        ? labelPrefix + ' > ' + localizedTabLabel
        : localizedTabLabel

      reduced.push(
        ...reduceFieldsToOptions({
          fieldPermissions,
          fields: field.fields,
          i18n,
          labelPrefix: labelWithPrefix,
          pathPrefix,
        }),
      )
      return reduced
    }

    if (field.type === 'group' && 'fields' in field) {
      const translatedLabel = getTranslation(field.label || '', i18n)

      const labelWithPrefix = labelPrefix
        ? translatedLabel
          ? labelPrefix + ' > ' + translatedLabel
          : labelPrefix
        : translatedLabel

      if (fieldAffectsData(field)) {
        // Make sure we handle deeply nested groups
        const pathWithPrefix = field.name
          ? pathPrefix
            ? pathPrefix + '.' + field.name
            : field.name
          : pathPrefix

        reduced.push(
          ...reduceFieldsToOptions({
            fieldPermissions:
              typeof fieldPermissions === 'boolean'
                ? fieldPermissions
                : fieldPermissions[field.name]?.fields || fieldPermissions[field.name],
            fields: field.fields,
            i18n,
            labelPrefix: labelWithPrefix,
            pathPrefix: pathWithPrefix,
          }),
        )
      } else {
        reduced.push(
          ...reduceFieldsToOptions({
            fieldPermissions,
            fields: field.fields,
            i18n,
            labelPrefix: labelWithPrefix,
            pathPrefix,
          }),
        )
      }

      return reduced
    }

    if (field.type === 'array' && 'fields' in field) {
      const translatedLabel = getTranslation(field.label || '', i18n)

      const labelWithPrefix = labelPrefix
        ? translatedLabel
          ? labelPrefix + ' > ' + translatedLabel
          : labelPrefix
        : translatedLabel

      // Make sure we handle deeply nested groups
      const pathWithPrefix = field.name
        ? pathPrefix
          ? pathPrefix + '.' + field.name
          : field.name
        : pathPrefix

      reduced.push(
        ...reduceFieldsToOptions({
          fieldPermissions:
            typeof fieldPermissions === 'boolean'
              ? fieldPermissions
              : fieldPermissions[field.name]?.fields || fieldPermissions[field.name],
          fields: field.fields,
          i18n,
          labelPrefix: labelWithPrefix,
          pathPrefix: pathWithPrefix,
        }),
      )

      return reduced
    }

    if (typeof fieldTypes[field.type] === 'object') {
      if (
        fieldPermissions === true ||
        fieldPermissions?.[field.name] === true ||
        fieldPermissions?.[field.name]?.read === true
      ) {
        const operatorKeys = new Set()

        const fieldOperators =
          'hasMany' in field && field.hasMany ? arrayOperators : fieldTypes[field.type].operators

        const operators = fieldOperators.reduce((acc, operator) => {
          if (!operatorKeys.has(operator.value)) {
            operatorKeys.add(operator.value)
            const operatorKey = `operators:${operator.label}` as ClientTranslationKeys
            acc.push({
              ...operator,
              label: i18n.t(operatorKey),
            })
          }

          return acc
        }, [])

        const localizedLabel = getTranslation(field.label || '', i18n)

        const formattedLabel = labelPrefix
          ? combineFieldLabel({
              field,
              prefix: labelPrefix,
            })
          : localizedLabel

        const fieldPath = pathPrefix ? createNestedClientFieldPath(pathPrefix, field) : field.name

        const formattedField: ReducedField = {
          label: formattedLabel,
          plainTextLabel: `${labelPrefix ? labelPrefix + ' > ' : ''}${localizedLabel}`,
          value: fieldPath,
          ...fieldTypes[field.type],
          field,
          operators,
        }

        reduced.push(formattedField)
        return reduced
      }
    }
    return reduced
  }, [])
}
