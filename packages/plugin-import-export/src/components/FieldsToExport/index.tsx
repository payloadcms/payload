'use client'

import type { ListPreferences, SelectFieldClientComponent } from 'payload'
import type { ReactNode } from 'react'

import {
  FieldLabel,
  ReactSelect,
  useConfig,
  useDocumentInfo,
  useField,
  usePreferences,
} from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { useImportExport } from '../ImportExportProvider/index.js'
import { reduceFields } from './reduceFields.js'

const baseClass = 'fields-to-export'

export const FieldsToExport: SelectFieldClientComponent = (props) => {
  const { id } = useDocumentInfo()
  const { path } = props
  const { setValue, value } = useField<string[]>({ path })
  const { value: collectionSlug } = useField<string>({ path: 'collectionSlug' })
  const { getEntityConfig } = useConfig()
  const { collection } = useImportExport()
  const { getPreference } = usePreferences()
  const [displayedValue, setDisplayedValue] = useState<
    { id: string; label: ReactNode; value: string }[]
  >([])

  const collectionConfig = getEntityConfig({ collectionSlug: collectionSlug ?? collection })
  const fieldOptions = reduceFields({ fields: collectionConfig?.fields })

  useEffect(() => {
    if (value && value.length > 0) {
      setDisplayedValue((prevDisplayedValue) => {
        if (prevDisplayedValue.length > 0) {
          return prevDisplayedValue
        } // Prevent unnecessary updates

        return value.map((field) => {
          const match = fieldOptions.find((option) => option.value === field)
          return match ? { ...match, id: field } : { id: field, label: field, value: field }
        })
      })
    }
  }, [value, fieldOptions, id])

  useEffect(() => {
    const doAsync = async () => {
      const currentPreferences = await getPreference<{
        columns: ListPreferences['columns']
      }>(`${collectionSlug}-list`)

      if (!currentPreferences) {
        return
      }

      const columns = currentPreferences?.columns?.filter((a) => a.active).map((b) => b.accessor)
      setValue(columns)
    }

    void doAsync()
  }, [getPreference, collection, setValue, collectionSlug])
  const onChange = (options: { id: string; label: ReactNode; value: string }[]) => {
    if (!options) {
      setValue([])
      return
    }
    const updatedValue = options?.map((option) =>
      typeof option === 'object' ? option.value : option,
    )
    setValue(updatedValue)
    setDisplayedValue(options)
  }

  return (
    <div className={baseClass}>
      <FieldLabel label="Columns to Export" />
      <ReactSelect
        className={baseClass}
        disabled={props.readOnly}
        getOptionValue={(option) => String(option.value)}
        isClearable={true}
        isMulti={true}
        isSortable={true}
        // @ts-expect-error react select option
        onChange={onChange}
        options={fieldOptions}
        value={displayedValue}
      />
    </div>
  )
}
