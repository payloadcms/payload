'use client'
import type { OptionObject, TextFieldClientComponent } from 'payload'

import React, { useCallback, useMemo } from 'react'

import { SelectInput } from '../../../fields/Select/Input.js'
import { useField } from '../../../forms/useField/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../../utilities/reduceFieldsToOptions.js'
import { isCollectionQuerySortableField } from '../shared.js'

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
  const { i18n } = useTranslation()

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

    const fieldOptions = reduceFieldsToOptions({
      fieldPermissions: permissions?.collections?.[relatedCollection]?.fields ?? true,
      fields: collectionConfig.fields,
      i18n,
    })
      .filter(({ field }) => isCollectionQuerySortableField(field))
      .map(({ plainTextLabel, value }) => ({
        label: plainTextLabel,
        value: String(value),
      }))

    return [
      { label: 'ID', value: 'id' },
      { label: 'Created At', value: 'createdAt' },
      { label: 'Updated At', value: 'updatedAt' },
      ...fieldOptions,
    ]
  }, [collectionConfig, i18n, permissions, relatedCollection])

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
        relatedCollection ? 'Select a field to sort by' : 'Select a collection before choosing sort'
      }
      readOnly={readOnly || !relatedCollection}
      required={required}
      showError={showError}
      value={value}
    />
  )
}
