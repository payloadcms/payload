'use client'
import type { ClientField, Column, ColumnPreference, JSONFieldClientComponent } from 'payload'

import { fieldIsHiddenOrDisabled, fieldIsID, flattenTopLevelFields } from 'payload/shared'
import React, { useMemo } from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import { useAuth } from '../../../../providers/Auth/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { filterFieldsWithPermissions } from '../../../../providers/TableColumns/buildColumnState/filterFieldsWithPermissions.js'
import { isColumnActive } from '../../../../providers/TableColumns/buildColumnState/isColumnActive.js'
import { sortFieldMap } from '../../../../providers/TableColumns/buildColumnState/sortFieldMap.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { getColumns } from '../../../../utilities/getColumns.js'
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

  // Build the full column set from every field (active and inactive), mirroring the
  // list view's `buildColumnState`, so columns absent from the saved preferences still
  // appear in the selector. No cells are rendered here.
  const columns: Column[] = useMemo(() => {
    if (!collectionConfig?.fields) {
      return []
    }

    const fieldPermissions = permissions?.collections?.[relatedCollection]?.fields ?? true

    let sortedFieldMap = flattenTopLevelFields(
      filterFieldsWithPermissions({ fieldPermissions, fields: collectionConfig.fields }),
      {
        i18n,
        keepPresentationalFields: true,
        moveSubFieldsToTop: true,
      },
    ) as ClientField[]

    // Place the `id` field first, then the `useAsTitle` field, matching the list view.
    const idFieldIndex = sortedFieldMap.findIndex((field) => fieldIsID(field))
    if (idFieldIndex > -1) {
      sortedFieldMap.unshift(sortedFieldMap.splice(idFieldIndex, 1)[0])
    }

    const useAsTitle = collectionConfig.admin?.useAsTitle
    const useAsTitleFieldIndex = useAsTitle
      ? sortedFieldMap.findIndex((field) => 'name' in field && field.name === useAsTitle)
      : -1
    if (useAsTitleFieldIndex > -1) {
      sortedFieldMap.unshift(sortedFieldMap.splice(useAsTitleFieldIndex, 1)[0])
    }

    sortedFieldMap = sortFieldMap(sortedFieldMap, columnPreferences)

    const activeColumnsIndices: number[] = []

    return sortedFieldMap.reduce<Column[]>((acc, field, colIndex) => {
      if (fieldIsHiddenOrDisabled(field) && !fieldIsID(field)) {
        return acc
      }

      // Groups render as their flattened subfields, not as a selectable column.
      if (field.type === 'group') {
        return acc
      }

      const accessor =
        'accessor' in field
          ? (field as { accessor: string }).accessor
          : 'name' in field
            ? field.name
            : undefined

      if (!accessor) {
        return acc
      }

      const columnPref = columnPreferences.find((pref) => pref.accessor === accessor)
      const active = isColumnActive({
        accessor,
        activeColumnsIndices,
        column: columnPref,
        columns: columnPreferences,
      })

      if (active) {
        activeColumnsIndices.push(colIndex)
      }

      acc.push({
        accessor,
        active,
        field,
        Heading: null,
        renderedCells: [],
      })

      return acc
    }, [])
  }, [collectionConfig, columnPreferences, i18n, permissions, relatedCollection])

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
