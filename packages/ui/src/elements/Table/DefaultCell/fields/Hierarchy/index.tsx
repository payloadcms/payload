'use client'
import type { DefaultCellComponentProps, RelationshipFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { SelectionWithPath } from '../../../../Hierarchy/Modal/types.js'

import { useIntersect } from '../../../../../hooks/useIntersect.js'
import { FolderIcon } from '../../../../../icons/Folder/index.js'
import { TagIcon } from '../../../../../icons/Tag/index.js'
import { useBranchParam } from '../../../../../providers/Branch/index.js'
import { useConfig } from '../../../../../providers/Config/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'
import { canUseDOM } from '../../../../../utilities/canUseDOM.js'
import { formatDocTitle } from '../../../../../utilities/formatDocTitle/index.js'
import {
  getEffectiveHierarchyCollections,
  getHierarchyCollectionRestrictions,
} from '../../../../../utilities/hierarchyCollectionRestrictions.js'
import { getHierarchyListURL } from '../../../../../views/HierarchyList/getHierarchyListURL.js'
import { Button } from '../../../../Button/index.js'
import { HierarchyActionsMenu } from '../../../../Hierarchy/ActionsMenu/index.js'
import { useHierarchyModal } from '../../../../Hierarchy/Modal/useHierarchyModal.js'
import { useListRelationships } from '../../../RelationshipProvider/index.js'
import { buildHierarchyCellUpdateURL } from './buildHierarchyCellUpdateURL.js'
import './index.css'

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
  const branch = useBranchParam()
  const [intersectionRef, entry] = useIntersect()
  const [values, setValues] = useState<Value[]>([])
  const { documents, getRelationships } = useListRelationships()
  const hasRequestedRef = useRef(false)
  const prevCellDataRef = useRef<typeof cellDataFromProps>(undefined)
  const { i18n, t } = useTranslation()

  const isAboveViewport = canUseDOM ? entry?.boundingClientRect?.top < window.innerHeight : false

  // Get the hierarchy collection config
  const hierarchyCollectionSlug = typeof relationTo === 'string' ? relationTo : undefined
  const hierarchyCollectionConfig = hierarchyCollectionSlug
    ? getEntityConfig({ collectionSlug: hierarchyCollectionSlug })
    : undefined

  // Use pre-rendered icon from server if available, otherwise determine on client
  const { hierarchyConfig, relatedCollectionSlugs, typeFieldName } = useMemo(
    () => getHierarchyCollectionRestrictions({ collectionConfig: hierarchyCollectionConfig }),
    [hierarchyCollectionConfig],
  )

  const filterByCollection = useMemo(() => {
    if (!hierarchyCollectionSlug) {
      return undefined
    }
    if (collectionSlug !== hierarchyCollectionSlug) {
      return [collectionSlug]
    }
    if (!typeFieldName) {
      return undefined
    }
    const allowedCollections = rowData[typeFieldName]

    return getEffectiveHierarchyCollections({
      allowedCollections: Array.isArray(allowedCollections)
        ? (allowedCollections as string[])
        : undefined,
      relatedCollectionSlugs,
    })
  }, [collectionSlug, hierarchyCollectionSlug, relatedCollectionSlugs, rowData, typeFieldName])

  const disabledIds = useMemo(
    () =>
      collectionSlug === hierarchyCollectionSlug && rowData.id !== undefined
        ? new Set([rowData.id])
        : undefined,
    [collectionSlug, hierarchyCollectionSlug, rowData.id],
  )

  // Pre-rendered icons from server (supports custom icons)
  const preRenderedIcon = customCellProps?.hierarchyIcon as React.ReactNode | undefined
  const preRenderedSmallIcon = customCellProps?.hierarchySmallIcon as React.ReactNode | undefined

  // Fallback icon for client-side rendering
  const fallbackIcon = useMemo(() => {
    if (preRenderedIcon) {
      return null // Don't need fallback if we have pre-rendered icon
    }
    // Default based on allowHasMany: false = folder-like, true = tag-like
    const IconComponent = hierarchyConfig?.allowHasMany === false ? FolderIcon : TagIcon
    return <IconComponent />
  }, [hierarchyConfig, preRenderedIcon])

  // Full icon for modal subheader
  const drawerIcon = preRenderedIcon || fallbackIcon
  // Small icon for compact display
  const displayIcon = preRenderedSmallIcon ?? drawerIcon

  // Set up the hierarchy modal
  const [HierarchyModal, , { openModal }] = useHierarchyModal({
    disabledIds,
    filterByCollection,
    hierarchyCollectionSlug: hierarchyCollectionSlug || '',
    Icon: drawerIcon,
  })

  // Lazy-mount the modal so its column browser doesn't eagerly fetch root items
  // for every cell in the list view. Only mount once the user opens it.
  const [hasMountedModal, setHasMountedModal] = useState(false)
  const shouldOpenAfterMountRef = useRef(false)

  const handleOpenModal = useCallback(() => {
    if (hasMountedModal) {
      openModal()
      return
    }
    shouldOpenAfterMountRef.current = true
    setHasMountedModal(true)
  }, [hasMountedModal, openModal])

  // Open the modal once it has mounted (state update from handleOpenModal).
  useEffect(() => {
    if (hasMountedModal && shouldOpenAfterMountRef.current) {
      shouldOpenAfterMountRef.current = false
      openModal()
    }
  }, [hasMountedModal, openModal])

  // Fetch relationship data when visible
  useEffect(() => {
    // Reset tracking if data changed
    if (prevCellDataRef.current !== cellDataFromProps) {
      prevCellDataRef.current = cellDataFromProps
      hasRequestedRef.current = false
    }

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

  // Read from local state so the picker reflects in-place moves and removes
  const initialSelections = useMemo(() => values.map(({ value }) => value), [values])

  const saveIds = useCallback(
    async (selectedIds: (number | string)[]) => {
      try {
        const response = await fetch(
          buildHierarchyCellUpdateURL({
            id: rowData.id,
            apiRoute: config.routes.api,
            branch,
            collectionSlug,
            serverURL: config.serverURL,
          }),
          {
            body: JSON.stringify({
              [field.name]: hasMany ? selectedIds : (selectedIds[0] ?? null),
            }),
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PATCH',
          },
        )

        if (!response.ok) {
          const responseData = await response.json().catch(() => null)
          const errorMessage =
            responseData?.errors?.[0]?.message ||
            responseData?.error ||
            responseData?.message ||
            t('error:unknown')

          toast.error(errorMessage)
          return false
        }

        if (typeof relationTo === 'string') {
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
      } catch {
        toast.error(t('error:unknown'))
        return false
      }

      return true
    },
    [branch, collectionSlug, config, field.name, getRelationships, hasMany, relationTo, rowData, t],
  )

  const handleSave = useCallback(
    async ({
      closeModal,
      selections,
    }: {
      closeModal: () => void
      selections: Map<number | string, SelectionWithPath>
    }) => {
      if (await saveIds(Array.from(selections.keys()))) {
        closeModal()
      }
    },
    [saveIds],
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
  const currentId = !hasMany && values.length === 1 ? values[0].value : undefined
  const hasSingleSelection = typeof currentId === 'number' || typeof currentId === 'string'
  const hierarchyLabel =
    getTranslation(
      hierarchyCollectionConfig?.labels?.singular || hierarchyCollectionSlug || '',
      i18n,
    ) || hierarchyCollectionSlug

  const handleRemove = useCallback(() => saveIds([]), [saveIds])

  const goTo = useMemo(
    () =>
      hasSingleSelection && hierarchyCollectionSlug
        ? {
            name: displayText,
            href: getHierarchyListURL({
              adminRoute: config.routes.admin,
              collectionSlug: hierarchyCollectionSlug,
              parentFieldName: hierarchyConfig?.parentFieldName,
              parentID: currentId,
            }),
          }
        : undefined,
    [
      config.routes.admin,
      currentId,
      displayText,
      hasSingleSelection,
      hierarchyCollectionSlug,
      hierarchyConfig?.parentFieldName,
    ],
  )

  const label = isLoading ? `${t('general:loading')}...` : displayText

  return (
    <div className={baseClass} ref={intersectionRef}>
      <HierarchyActionsMenu
        goTo={goTo}
        hasActions={hasSingleSelection}
        hierarchyLabel={hierarchyLabel}
        onMove={handleOpenModal}
        onRemove={handleRemove}
        renderTrigger={(triggerProps) => (
          <Button
            aria-label={triggerProps ? label : undefined}
            buttonStyle="secondary"
            className={`${baseClass}__button`}
            extraButtonProps={triggerProps?.extraButtonProps}
            icon={displayIcon}
            iconPosition="left"
            margin={false}
            onClick={triggerProps?.onClick ?? handleOpenModal}
            selected={triggerProps?.selected}
            size="medium"
            tooltip={triggerProps ? displayText : undefined}
          >
            {triggerProps ? <span className={`${baseClass}__truncate`}>{label}</span> : label}
          </Button>
        )}
      />
      {hierarchyCollectionSlug && hasMountedModal && (
        <HierarchyModal
          confirmLabel={t('general:confirm')}
          hasMany={hasMany}
          initialSelections={initialSelections}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
