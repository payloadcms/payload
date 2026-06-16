'use client'
import type { ClientField, Column, ColumnPreference, JSONFieldClientComponent } from 'payload'

import React, { useMemo } from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import { useAuth } from '../../../../providers/Auth/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { getColumns } from '../../../../utilities/getColumns.js'
import { reduceFieldsToOptions } from '../../../../utilities/reduceFieldsToOptions.js'
import { ColumnsButton } from '../../../ColumnsButton/index.js'
import './index.css'

export const QueryPresetsColumnField: JSONFieldClientComponent = ({
  field: { label, required },
}) => {
  const { path, setValue, value } = useField<ColumnPreference[]>()
  const relatedCollectionField = useField({ path: 'relatedCollection' })
  const relatedCollection = relatedCollectionField.value as string | undefined
  const { config, getEntityConfig } = useConfig()
  const { i18n } = useTranslation()
  const { permissions } = useAuth()

  const collectionConfig = useMemo(
    () => (relatedCollection ? getEntityConfig({ collectionSlug: relatedCollection }) : null),
    [relatedCollection, getEntityConfig],
  )

  const columnPreferences = useMemo(() => {
    if (!relatedCollection || !collectionConfig) {
      return []
    }
    return getColumns({
      clientConfig: config,
      collectionConfig,
      collectionSlug: relatedCollection,
      columns: value ?? [],
      i18n,
      permissions,
    })
  }, [config, collectionConfig, relatedCollection, value, i18n, permissions])

  const fieldByPath = useMemo(() => {
    if (!collectionConfig?.fields) {
      return new Map<string, ClientField>()
    }
    const reducedFields = reduceFieldsToOptions({
      fieldPermissions: permissions?.collections?.[relatedCollection]?.fields ?? true,
      fields: collectionConfig.fields,
      i18n,
    })
    return new Map(reducedFields.map((f) => [String(f.fieldPath), f.field]))
  }, [collectionConfig, i18n, permissions, relatedCollection])

  // Build minimal `Column`s from preferences; no cells rendered here.
  const columns: Column[] = useMemo(
    () =>
      columnPreferences.reduce<Column[]>((acc, col) => {
        const field = fieldByPath.get(col.accessor)
        if (field) {
          acc.push({
            accessor: col.accessor,
            active: col.active,
            field,
            Heading: null,
            renderedCells: [],
          })
        }
        return acc
      }, []),
    [columnPreferences, fieldByPath],
  )

  const handleChange = React.useCallback(
    (newColumns: Column[]) => {
      const preferences: ColumnPreference[] = newColumns.map((col) => ({
        accessor: col.accessor,
        active: col.active,
      }))
      setValue(preferences.length ? preferences : undefined)
    },
    [setValue],
  )

  if (!relatedCollection || !collectionConfig) {
    return (
      <div className="field-type query-preset-columns-field">
        <FieldLabel as="h3" label={label} path={path} required={required} />
        <p className="query-preset-columns-field__hint">
          Select the related collection to configure columns.
        </p>
      </div>
    )
  }

  return (
    <div className="field-type query-preset-columns-field">
      <ColumnsButton collectionSlug={relatedCollection} columns={columns} onChange={handleChange} />
    </div>
  )
}
