'use client'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import type { SelectionWithPath } from '../HierarchyDrawer/types.js'

import { useForm, useFormFields } from '../../forms/Form/context.js'
import { FolderIcon } from '../../icons/Folder/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { useHierarchyDrawer } from '../HierarchyDrawer/index.js'
import './index.scss'

const baseClass = 'hierarchy-button'

export type HierarchyButtonClientProps = {
  collectionSlug: string
  fieldName: string
  hasMany?: boolean
  Icon?: React.ReactNode
  readOnly?: boolean
}

export const HierarchyButtonClient: React.FC<HierarchyButtonClientProps> = ({
  collectionSlug,
  fieldName,
  hasMany = false,
  Icon,
  readOnly,
}) => {
  const { t } = useTranslation()
  const { config, getEntityConfig } = useConfig()
  const { setModified } = useForm()
  const dispatchField = useFormFields(([_, dispatch]) => dispatch)

  const currentFieldValue = useFormFields(([fields]) => (fields && fields?.[fieldName]) || null)
  const currentId = currentFieldValue?.value as null | number | string

  const [displayName, setDisplayName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const collectionConfig = getEntityConfig({ collectionSlug })
  const useAsTitle = collectionConfig?.admin?.useAsTitle || 'name'

  const [HierarchyDrawer, , { openDrawer }] = useHierarchyDrawer({
    collectionSlug,
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
              path: `/${collectionSlug}/${currentId}`,
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
  }, [currentId, collectionSlug, config.routes.api, config.serverURL, useAsTitle, t])

  const handleDrawerSave = useCallback(
    (selections: Map<number | string, SelectionWithPath>, closeDrawer: () => void) => {
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
      closeDrawer()
    },
    [currentFieldValue?.value, dispatchField, fieldName, hasMany, setModified],
  )

  const handleClick = useCallback(() => {
    if (!readOnly) {
      openDrawer()
    }
  }, [openDrawer, readOnly])

  const label = isLoading ? `${t('general:loading')}...` : displayName

  return (
    <>
      <Button
        buttonStyle="subtle"
        className={[baseClass, readOnly && `${baseClass}--read-only`].filter(Boolean).join(' ')}
        disabled={readOnly}
        icon={Icon || <FolderIcon />}
        iconPosition="left"
        margin={false}
        onClick={handleClick}
      >
        {label}
      </Button>
      <HierarchyDrawer
        hasMany={hasMany}
        initialSelections={currentId ? [currentId] : undefined}
        onSave={handleDrawerSave}
      />
    </>
  )
}
