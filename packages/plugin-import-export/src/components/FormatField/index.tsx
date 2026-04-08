'use client'

import type { ReactSelectOption } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'

import { FieldLabel, ReactSelect, useConfig, useField } from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo } from 'react'

const baseClass = 'field-type select'

type Format = 'csv' | 'json'

const allOptions: ReactSelectOption[] = [
  { label: 'CSV', value: 'csv' },
  { label: 'JSON', value: 'json' },
]

export const FormatField: SelectFieldClientComponent = (props) => {
  const { getEntityConfig } = useConfig()
  const width = props.field.admin?.width

  const { setValue, value: formatValue } = useField<Format>()
  const { value: targetCollectionSlug } = useField<string>({ path: 'collectionSlug' })

  const targetCollectionConfig = getEntityConfig({ collectionSlug: targetCollectionSlug })
  const forcedFormat = targetCollectionConfig?.admin?.custom?.['plugin-import-export']
    ?.exportFormat as Format | undefined

  const options = useMemo<ReactSelectOption[]>(() => {
    if (forcedFormat) {
      return [{ label: forcedFormat.toUpperCase(), value: forcedFormat }]
    }
    return allOptions
  }, [forcedFormat])

  const selectedOption = useMemo<ReactSelectOption | undefined>(() => {
    const effectiveValue = forcedFormat || formatValue || 'csv'
    return options.find((o) => o.value === effectiveValue) ?? options[0]
  }, [forcedFormat, formatValue, options])

  useEffect(() => {
    if (forcedFormat && formatValue !== forcedFormat) {
      setValue(forcedFormat)
    }
  }, [forcedFormat, formatValue, setValue])

  const handleChange = useCallback(
    (selected: ReactSelectOption | ReactSelectOption[]) => {
      if (forcedFormat) {
        return
      }
      if (Array.isArray(selected)) {
        setValue((selected[0]?.value as Format) ?? 'csv')
      } else {
        setValue((selected?.value as Format) ?? 'csv')
      }
    },
    [forcedFormat, setValue],
  )

  const isReadOnly = Boolean(forcedFormat) || props.readOnly

  return (
    <div className={baseClass} style={{ width }}>
      <FieldLabel label={props.field.label} path={props.path} />
      <ReactSelect
        className={'format-field'}
        disabled={isReadOnly}
        inputId={`field-${props.path.replace(/\./g, '__')}`}
        isClearable={false}
        isSearchable={false}
        onChange={handleChange}
        options={options}
        value={selectedOption}
      />
    </div>
  )
}
