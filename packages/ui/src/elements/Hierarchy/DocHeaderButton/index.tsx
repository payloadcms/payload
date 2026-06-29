'use client'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { SelectionWithPath } from '../Modal/types.js'

import { useForm, useFormFields } from '../../../forms/Form/context.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useHierarchyModal } from '../Modal/useHierarchyModal.js'
import './index.css'

const baseClass = 'hierarchy-button'

export type HierarchyButtonClientProps = {
  fieldName: string
  hasMany?: boolean
  hierarchyCollectionSlug: string
  Icon?: React.ReactNode
  readOnly?: boolean
  SmallIcon?: React.ReactNode
}

export const HierarchyButtonClient: React.FC<HierarchyButtonClientProps> = ({
  fieldName,
  hasMany = false,
  hierarchyCollectionSlug,
  Icon,
  readOnly: readOnlyFromProps,
  SmallIcon,
}) => {
  const { t } = useTranslation()
  const { config, getEntityConfig } = useConfig()
  const { collectionSlug: documentCollectionSlug } = useDocumentInfo()
  const { disabled: formDisabled, setModified } = useForm()
  const readOnly = readOnlyFromProps || formDisabled
  const dispatchField = useFormFields(([_, dispatch]) => dispatch)

  const currentFieldValue = useFormFields(([fields]) => (fields && fields?.[fieldName]) || null)
  const currentId = currentFieldValue?.value as null | number | string

  const [displayName, setDisplayName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const collectionConfig = getEntityConfig({ collectionSlug: hierarchyCollectionSlug })
  const useAsTitle = collectionConfig?.admin?.useAsTitle || 'name'

  const isHierarchyCollection = documentCollectionSlug === hierarchyCollectionSlug

  // When in hierarchy collection, let the modal use allowedCollections from context
  // When in other collections, filter by that collection's slug
  // Memoize to prevent new array references on every render
  const filterByCollection = useMemo(
    () => (isHierarchyCollection || !documentCollectionSlug ? undefined : [documentCollectionSlug]),
    [isHierarchyCollection, documentCollectionSlug],
  )

  const [HierarchyModal, , { openModal }] = useHierarchyModal({
    filterByCollection,
    hierarchyCollectionSlug,
    Icon,
  })

  // Fetch item name when currentId changes
  useEffect(() => {
    const fetchItemName = async () => {
      if (currentId && (typeof currentId === 'string' || typeof currentId === 'number')) {
        setIsLoading(true)
        try {
          const response = await fetch(
            formatAdminURL({
              apiRoute: config.routes.api,
              path: `/${hierarchyCollectionSlug}/${currentId}`,
              serverURL: config.serverURL,
            }),
            { credentials: 'include' },
          )

          if (response.ok) {
            const itemData = await response.json()
            const title = itemData?.[useAsTitle] || itemData?.name || itemData?.id

            setDisplayName(String(title))
          } else {
            setDisplayName(t('general:none'))
          }
        } catch {
          setDisplayName(t('general:none'))
        } finally {
          setIsLoading(false)
        }
      } else {
        setDisplayName(t('general:none'))
        setIsLoading(false)
      }
    }

    void fetchItemName()
  }, [currentId, hierarchyCollectionSlug, config.routes.api, config.serverURL, useAsTitle, t])

  const handleModalSave = useCallback(
    ({
      closeModal,
      selections,
    }: {
      closeModal: () => void
      selections: Map<number | string, SelectionWithPath>
    }) => {
      const ids = Array.from(selections.keys())
      const newValue = hasMany ? ids : (ids[0] ?? null)

      if (currentFieldValue?.value !== newValue) {
        dispatchField({
          type: 'UPDATE',
          path: fieldName,
          value: newValue,
        })
        setModified(true)
      }
      closeModal()
    },
    [currentFieldValue?.value, dispatchField, fieldName, hasMany, setModified],
  )

  const handleClick = useCallback(() => {
    if (!readOnly) {
      openModal()
    }
  }, [openModal, readOnly])

  const label = isLoading ? `${t('general:loading')}...` : displayName

  return (
    <>
      <Button
        buttonStyle="secondary"
        className={[baseClass, readOnly && `${baseClass}--read-only`].filter(Boolean).join(' ')}
        disabled={readOnly}
        icon={SmallIcon ?? Icon}
        iconPosition="left"
        margin={false}
        onClick={handleClick}
      >
        {label}
      </Button>
      <HierarchyModal
        hasMany={hasMany}
        initialSelections={currentId ? [currentId] : undefined}
        onSave={handleModalSave}
      />
    </>
  )
}
