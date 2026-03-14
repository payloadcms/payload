'use client'
import type { DefaultCellComponentProps, RelationshipFieldClient } from 'payload'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { SelectionWithPath } from '../../../../HierarchyDrawer/types.js'

import { useIntersect } from '../../../../../hooks/useIntersect.js'
import { FolderIcon } from '../../../../../icons/Folder/index.js'
import { TagIcon } from '../../../../../icons/Tag/index.js'
import { useConfig } from '../../../../../providers/Config/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'
import { canUseDOM } from '../../../../../utilities/canUseDOM.js'
import { formatDocTitle } from '../../../../../utilities/formatDocTitle/index.js'
import { Button } from '../../../../Button/index.js'
import { useHierarchyDrawer } from '../../../../HierarchyDrawer/index.js'
import { useListRelationships } from '../../../RelationshipProvider/index.js'
import './index.scss'

type Value = { relationTo: string; value: number | string }
const baseClass = 'hierarchy-cell'

export type HierarchyCellProps = DefaultCellComponentProps<RelationshipFieldClient>

export const HierarchyCell: React.FC<HierarchyCellProps> = ({
  cellData: cellDataFromProps,
  collectionSlug,
  customCellProps,
  field,
  rowData,
}) => {
  const relationTo = 'relationTo' in field ? field.relationTo : undefined
  const hasMany = field.hasMany ?? false

  const { config, getEntityConfig } = useConfig()
  const [intersectionRef, entry] = useIntersect()
  const [values, setValues] = useState<Value[]>([])
  const { documents, getRelationships } = useListRelationships()
  const hasRequestedRef = useRef(false)
  const { i18n, t } = useTranslation()

  const isAboveViewport = canUseDOM ? entry?.boundingClientRect?.top < window.innerHeight : false

  // Get the hierarchy collection config
  const hierarchyCollectionSlug = typeof relationTo === 'string' ? relationTo : undefined
  const hierarchyCollectionConfig = hierarchyCollectionSlug
    ? getEntityConfig({ collectionSlug: hierarchyCollectionSlug })
    : undefined

  // Use pre-rendered icon from server if available, otherwise determine on client
  const hierarchyConfig =
    hierarchyCollectionConfig?.hierarchy && typeof hierarchyCollectionConfig.hierarchy === 'object'
      ? hierarchyCollectionConfig.hierarchy
      : undefined

  // Pre-rendered icon from server (supports custom icons)
  const preRenderedIcon = customCellProps?.hierarchyIcon as React.ReactNode | undefined

  // Fallback icon for client-side rendering
  const fallbackIcon = useMemo(() => {
    if (preRenderedIcon) {
      return null // Don't need fallback if we have pre-rendered icon
    }
    // Default based on allowHasMany: false = folder-like, true = tag-like
    const IconComponent = hierarchyConfig?.allowHasMany === false ? FolderIcon : TagIcon
    return <IconComponent color="muted" />
  }, [hierarchyConfig, preRenderedIcon])

  // Set up the hierarchy drawer
  const [HierarchyDrawer, , { openDrawer }] = useHierarchyDrawer({
    hierarchyCollectionSlug: hierarchyCollectionSlug || '',
  })

  // Fetch relationship data when visible
  useEffect(() => {
    if (
      (cellDataFromProps || typeof cellDataFromProps === 'number') &&
      isAboveViewport &&
      !hasRequestedRef.current &&
      typeof relationTo === 'string'
    ) {
      const formattedValues: Value[] = []
      const arrayCellData = Array.isArray(cellDataFromProps)
        ? cellDataFromProps
        : [cellDataFromProps]

      arrayCellData.forEach((cell) => {
        if (typeof cell === 'object' && 'relationTo' in cell && 'value' in cell) {
          formattedValues.push(cell)
        }
        if (typeof cell === 'number' || typeof cell === 'string') {
          formattedValues.push({
            relationTo,
            value: cell,
          })
        }
      })

      getRelationships(formattedValues)
      hasRequestedRef.current = true
      setValues(formattedValues)
    }
  }, [cellDataFromProps, relationTo, isAboveViewport, getRelationships])

  // Reset when data changes
  useEffect(() => {
    hasRequestedRef.current = false
  }, [cellDataFromProps])

  // Get current selection IDs for the drawer
  const initialSelections = useMemo(() => {
    if (!cellDataFromProps) {
      return []
    }
    const data = Array.isArray(cellDataFromProps) ? cellDataFromProps : [cellDataFromProps]
    return data.map((item) => {
      if (typeof item === 'object' && 'value' in item) {
        return item.value
      }
      return item
    }) as (number | string)[]
  }, [cellDataFromProps])

  // Handle save from drawer
  const handleSave = useCallback(
    async ({
      closeDrawer,
      selections,
    }: {
      closeDrawer: () => void
      selections: Map<number | string, SelectionWithPath>
    }) => {
      // Get selected IDs
      const selectedIds = Array.from(selections.keys())
      const newValue = hasMany ? selectedIds : (selectedIds[0] ?? null)

      // Update the document via API
      try {
        const response = await fetch(
          `${config.serverURL}${config.routes.api}/${collectionSlug}/${rowData.id}`,
          {
            body: JSON.stringify({
              [field.name]: newValue,
            }),
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PATCH',
          },
        )

        if (response.ok && typeof relationTo === 'string') {
          // Update local state with new selection to avoid page reload
          const newValues: Value[] = selectedIds.map((id) => ({
            relationTo,
            value: id,
          }))
          setValues(newValues)

          // Request the new relationship docs to update the display
          if (newValues.length > 0) {
            getRelationships(newValues)
          }
        }
      } catch (_error) {
        // swallow error and close drawer anyway, user can try again
      }

      closeDrawer()
    },
    [collectionSlug, config, field.name, hasMany, rowData, relationTo, getRelationships],
  )

  // Build display labels
  const labels = useMemo(() => {
    return values.map(({ relationTo: rel, value }) => {
      const document = documents[rel]?.[value]
      const relatedCollection = getEntityConfig({ collectionSlug: rel })

      return formatDocTitle({
        collectionConfig: relatedCollection,
        data: document || null,
        dateFormat: config.admin.dateFormat,
        fallback: `${t('general:untitled')} - ID: ${value}`,
        i18n,
      })
    })
  }, [values, documents, getEntityConfig, config.admin.dateFormat, t, i18n])

  const displayText = labels.length > 0 ? labels.join(', ') : t('general:none')
  const isLoading =
    values.length > 0 &&
    values.some(({ relationTo: rel, value }) => documents[rel]?.[value] === null)

  return (
    <div className={baseClass} ref={intersectionRef}>
      <Button
        buttonStyle="subtle"
        className={`${baseClass}__pill`}
        icon={preRenderedIcon || fallbackIcon}
        iconPosition="left"
        margin={false}
        onClick={openDrawer}
        size="small"
      >
        {isLoading ? `${t('general:loading')}...` : displayText}
      </Button>
      {hierarchyCollectionSlug && (
        <HierarchyDrawer
          hasMany={hasMany}
          initialSelections={initialSelections}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
