'use client'
import type { ColumnPreference, JSONFieldClientComponent } from 'payload'

import React, { useId, useMemo } from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import { useAuth } from '../../../../providers/Auth/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { getColumns } from '../../../../utilities/getColumns.js'
import { reduceFieldsToOptions } from '../../../../utilities/reduceFieldsToOptions.js'
import { PillSelector, type SelectablePill } from '../../../PillSelector/index.js'
import './index.scss'

export const QueryPresetsColumnField: JSONFieldClientComponent = ({
  field: { label, required },
}) => {
  const { path, setValue, value } = useField<ColumnPreference[]>()
  const relatedCollectionField = useField({ path: 'relatedCollection' })
  const relatedCollection = relatedCollectionField.value as string | undefined
  const { config, getEntityConfig } = useConfig()
  const { i18n } = useTranslation()
  const { permissions } = useAuth()
  const uuid = useId()

  const collectionConfig = useMemo(
    () => (relatedCollection ? getEntityConfig({ collectionSlug: relatedCollection }) : null),
    [relatedCollection, getEntityConfig],
  )

  const columns = useMemo(() => {
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

  const reducedFields = useMemo(() => {
    if (!collectionConfig?.fields) {
      return []
    }
    return reduceFieldsToOptions({
      fieldPermissions: permissions?.collections?.[relatedCollection]?.fields ?? true,
      fields: collectionConfig.fields,
      i18n,
    })
  }, [collectionConfig, i18n, permissions, relatedCollection])

  const accessorToLabel = useMemo(() => {
    const map: Record<string, React.ReactNode> = {}
    for (const f of reducedFields) {
      map[String(f.value)] = f.label
    }
    return map
  }, [reducedFields])

  const pills: SelectablePill[] = useMemo(
    () =>
      columns.map((col, i) => ({
        name: col.accessor,
        key: `${relatedCollection}-${col.accessor}-${i}-${uuid}`,
        Label: accessorToLabel[col.accessor] ?? col.accessor,
        selected: col.active,
      })),
    [accessorToLabel, columns, relatedCollection, uuid],
  )

  const currentColumns = value ?? columns

  const handleClick = React.useCallback(
    ({ pill }: { pill: SelectablePill }) => {
      const newColumns = currentColumns.map((col) =>
        col.accessor === pill.name ? { ...col, active: !col.active } : col,
      )
      setValue(newColumns.length ? newColumns : undefined)
    },
    [currentColumns, setValue],
  )

  if (!relatedCollection) {
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
      <FieldLabel as="h3" label={label} path={path} required={required} />
      {pills.length > 0 ? (
        <PillSelector onClick={handleClick} pills={pills} />
      ) : (
        <p className="query-preset-columns-field__hint">
          No columns available for this collection.
        </p>
      )}
    </div>
  )
}
