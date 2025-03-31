'use client'

import type { SelectFieldClientComponent } from 'payload'
import type { ReactNode } from 'react'

import {
  FieldLabel,
  ReactSelect,
  useConfig,
  useDocumentInfo,
  useField,
  useListQuery,
} from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { reduceFields } from '../FieldsToExport/reduceFields.js'
import { useImportExport } from '../ImportExportProvider/index.js'

const baseClass = 'sort-by-fields'

export const SortBy: SelectFieldClientComponent = (props) => {
  const { id } = useDocumentInfo()
  const { path } = props
  const { setValue, value } = useField<string>({ path })
  const { value: collectionSlug } = useField<string>({ path: 'collectionSlug' })
  const { query } = useListQuery()
  const { getEntityConfig } = useConfig()
  const { collection } = useImportExport()
  const [displayedValue, setDisplayedValue] = useState<{
    id: string
    label: ReactNode
    value: string
  } | null>(null)

  const collectionConfig = getEntityConfig({ collectionSlug: collectionSlug ?? collection })
  const fieldOptions = reduceFields({ fields: collectionConfig?.fields })

  // Sync displayedValue with value from useField
  useEffect(() => {
    if (!value) {
      setDisplayedValue(null)
      return
    }

    const option = fieldOptions.find((field) => field.value === value)
    if (option && (!displayedValue || displayedValue.value !== value)) {
      setDisplayedValue(option)
    }
  }, [value, fieldOptions])

  useEffect(() => {
    if (id || !query?.sort || value) {
      return
    }

    const option = fieldOptions.find((field) => field.value === query.sort)
    if (option) {
      setValue(option.value)
      setDisplayedValue(option)
    }
  }, [fieldOptions, id, query?.sort, value, setValue])

  const onChange = (option: { id: string; label: ReactNode; value: string } | null) => {
    if (!option) {
      setValue('')
      setDisplayedValue(null)
    } else {
      setValue(option.value)
      setDisplayedValue(option)
    }
  }

  return (
    <div className={baseClass} style={{ '--field-width': '33%' } as React.CSSProperties}>
      <FieldLabel label="Sort By" />
      <ReactSelect
        className={baseClass}
        disabled={props.readOnly}
        getOptionValue={(option) => String(option.value)}
        isClearable={true}
        isSortable={true}
        // @ts-expect-error react select option
        onChange={onChange}
        options={fieldOptions}
        // @ts-expect-error react select
        value={displayedValue}
      />
    </div>
  )
}
