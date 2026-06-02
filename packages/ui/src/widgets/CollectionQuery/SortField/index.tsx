'use client'
import type { Field, OptionObject, TextFieldClientComponent } from 'payload'

import React, { useCallback, useMemo } from 'react'

import { SelectInput } from '../../../fields/Select/Input.js'
import { useField } from '../../../forms/useField/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../../utilities/reduceFieldsToOptions.js'
import { getCollectionFieldPaths } from '../getCollectionFieldPaths.js'

const baseFieldValues = new Set(['createdAt', 'id', 'updatedAt'])

export const CollectionQuerySortField: TextFieldClientComponent = ({
  field,
  path: pathFromProps,
  readOnly,
}) => {
  const { name, admin, label, required } = field
  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    path,
    setValue,
    showError,
    value,
  } = useField<string>({ potentiallyStalePath: pathFromProps })
  const relatedCollectionField = useField({ path: 'relatedCollection' })
  const relatedCollection = relatedCollectionField.value as string | undefined
  const { config } = useConfig()
  const { permissions } = useAuth()
  const { i18n, t } = useTranslation()

  const collectionConfig = useMemo(() => {
    if (!relatedCollection) {
      return null
    }

    return config.collections?.find((collection) => collection.slug === relatedCollection) ?? null
  }, [config.collections, relatedCollection])

  const options = useMemo<OptionObject[]>(() => {
    if (!relatedCollection || !collectionConfig) {
      return []
    }

    // Reuse the same sortable-path rules as the server widget so the dropdown only offers fields
    // the API can actually sort by (e.g. excluding array sub-fields).
    const { sortableFieldPaths } = getCollectionFieldPaths(
      collectionConfig.fields as unknown as Field[],
    )

    const fieldOptions = reduceFieldsToOptions({
      fieldPermissions: permissions?.collections?.[relatedCollection]?.fields ?? true,
      fields: collectionConfig.fields,
      i18n,
    })
      .filter(
        ({ fieldPath }) => sortableFieldPaths.has(fieldPath) && !baseFieldValues.has(fieldPath),
      )
      .map(({ fieldPath, plainTextLabel }) => ({
        label: plainTextLabel ?? fieldPath,
        value: fieldPath,
      }))

    return [
      { label: 'ID', value: 'id' },
      { label: t('general:createdAt'), value: 'createdAt' },
      { label: t('general:updatedAt'), value: 'updatedAt' },
      ...fieldOptions,
    ]
  }, [collectionConfig, i18n, permissions, relatedCollection, t])

  const onChange = useCallback(
    (selectedOption: OptionObject | OptionObject[]) => {
      if (Array.isArray(selectedOption)) {
        return
      }

      setValue(typeof selectedOption?.value === 'string' ? selectedOption.value : null)
    },
    [setValue],
  )

  return (
    <SelectInput
      AfterInput={AfterInput}
      BeforeInput={BeforeInput}
      Description={Description}
      description={admin?.description}
      Error={Error}
      isClearable
      Label={Label}
      label={label}
      name={name}
      onChange={onChange}
      options={options}
      path={path}
      placeholder={
        relatedCollection
          ? t('dashboard:widgetSelectSortField')
          : t('dashboard:widgetSelectCollectionFirst')
      }
      readOnly={readOnly || !relatedCollection}
      required={required}
      showError={showError}
      value={value}
    />
  )
}
