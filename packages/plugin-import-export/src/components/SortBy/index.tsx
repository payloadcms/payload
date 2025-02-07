'use client'

import type { OptionObject } from 'payload'

import { FieldLabel, ReactSelect, useConfig, useField } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { reduceFields } from '../FieldsToExport/reduceFields.js'
import './index.scss'
import { useImportExport } from '../ImportExportProvider/index.js'

const baseClass = 'sort-by-fields'

export const SortByFields: React.FC = () => {
  const { setValue, value } = useField({ path: 'sort' })
  const { getEntityConfig } = useConfig()
  const { collection } = useImportExport()
  const collectionConfig = getEntityConfig({ collectionSlug: collection })

  const fieldOptions = reduceFields({ fields: collectionConfig.fields }) as any[]

  const options = fieldOptions.map((field) => {
    return {
      label: field.label,
      value: field.value.path,
    }
  })

  useEffect(() => {
    setValue(options[0])
  }, [])

  return (
    <div className={baseClass} style={{ '--field-width': '33%' } as React.CSSProperties}>
      <FieldLabel label="Sort By" />
      <ReactSelect
        isClearable={true}
        isMulti={false}
        onChange={(value) => setValue(value ?? null)}
        options={options}
        value={value as OptionObject}
      />
    </div>
  )
}
