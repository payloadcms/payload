'use client'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { SelectionWithPath } from '../Modal/types.js'

import { useForm, useFormFields } from '../../../forms/Form/context.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import {
  getEffectiveHierarchyCollections,
  getHierarchyCollectionRestrictions,
} from '../../../utilities/hierarchyCollectionRestrictions.js'
import { Button } from '../../Button/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
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
  const { i18n, t } = useTranslation()
  const { config, getEntityConfig } = useConfig()
  const { id: documentId, collectionSlug: documentCollectionSlug } = useDocumentInfo()
  const { disabled: formDisabled, setModified } = useForm()
  const readOnly = readOnlyFromProps || formDisabled
  const dispatchField = useFormFields(([_, dispatch]) => dispatch)

  const currentFieldValue = useFormFields(([fields]) => (fields && fields?.[fieldName]) || null)
  const currentSelections = useMemo(() => {
    const value = currentFieldValue?.value

    if (Array.isArray(value)) {
      return value.filter(
        (selection): selection is number | string =>
          typeof selection === 'number' || typeof selection === 'string',
      )
    }

    return typeof value === 'number' || typeof value === 'string' ? [value] : []
  }, [currentFieldValue?.value])
  const currentId = !hasMany ? currentSelections[0] : undefined

  const [displayName, setDisplayName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const collectionConfig = getEntityConfig({ collectionSlug: hierarchyCollectionSlug })
  const useAsTitle = collectionConfig?.admin?.useAsTitle || 'name'
  const { hierarchyConfig, relatedCollectionSlugs, typeFieldName } = useMemo(
    () => getHierarchyCollectionRestrictions({ collectionConfig }),
    [collectionConfig],
  )

  const allowedCollections = useFormFields(([fields]) => {
    const value = typeFieldName ? fields?.[typeFieldName]?.value : undefined

    return Array.isArray(value) ? (value as string[]) : undefined
  })

  const isHierarchyCollection = documentCollectionSlug === hierarchyCollectionSlug

  // When in hierarchy collection, let the modal use allowedCollections from context
  // When in other collections, filter by that collection's slug
  // Memoize to prevent new array references on every render
  const filterByCollection = useMemo(() => {
    if (!documentCollectionSlug) {
      return undefined
    }
    if (!isHierarchyCollection) {
      return [documentCollectionSlug]
    }
    if (!typeFieldName) {
      return undefined
    }
    return getEffectiveHierarchyCollections({ allowedCollections, relatedCollectionSlugs })
  }, [
    allowedCollections,
    documentCollectionSlug,
    isHierarchyCollection,
    relatedCollectionSlugs,
    typeFieldName,
  ])

  const disabledIds = useMemo(
    () => (isHierarchyCollection && documentId !== undefined ? new Set([documentId]) : undefined),
    [documentId, isHierarchyCollection],
  )

  const [HierarchyModal, , { openModal }] = useHierarchyModal({
    disabledIds,
    filterByCollection,
    hierarchyCollectionSlug,
    Icon,
  })

  // Fetch item name when currentId changes
  useEffect(() => {
    const fetchItemName = async () => {
      if (
        currentId !== null &&
        currentId !== undefined &&
        (typeof currentId === 'string' || typeof currentId === 'number')
      ) {
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
  const hasSingleSelection =
    !hasMany && (typeof currentId === 'number' || typeof currentId === 'string')
  const hierarchyLabel =
    getTranslation(collectionConfig?.labels?.singular || hierarchyCollectionSlug, i18n) ||
    hierarchyCollectionSlug
  const controlRef = useRef<HTMLDivElement | null>(null)
  const [shouldRefocus, setShouldRefocus] = useState(false)

  useEffect(() => {
    if (shouldRefocus) {
      controlRef.current?.querySelector('button')?.focus()
      setShouldRefocus(false)
    }
  }, [shouldRefocus])

  const handleRemove = useCallback(() => {
    dispatchField({
      type: 'UPDATE',
      path: fieldName,
      value: null,
    })
    setModified(true)
    setShouldRefocus(true)
  }, [dispatchField, fieldName, setModified])

  const goToHref = useMemo(() => {
    if (!hasSingleSelection || !documentCollectionSlug) {
      return undefined
    }

    const parentQueryParam = hierarchyConfig?.parentFieldName || 'parent'

    return formatAdminURL({
      adminRoute: config.routes.admin,
      path: `/collections/${documentCollectionSlug}/hierarchy?${parentQueryParam}=${currentId}`,
    })
  }, [
    config.routes.admin,
    currentId,
    documentCollectionSlug,
    hasSingleSelection,
    hierarchyConfig?.parentFieldName,
  ])

  const buttonClassName = [baseClass, readOnly && `${baseClass}--read-only`]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div className={`${baseClass}__control`} ref={controlRef}>
        {hasSingleSelection && !readOnly ? (
          <Popup
            caret={false}
            horizontalAlign="left"
            portalClassName={`${baseClass}__popup-content`}
            render={({ close }) => (
              <PopupList.MenuItem>
                <PopupList.Button
                  onClick={() => {
                    close()
                    requestAnimationFrame(openModal)
                  }}
                >
                  {t('hierarchy:moveTo')}
                </PopupList.Button>
                <PopupList.Button
                  onClick={() => {
                    close()
                    handleRemove()
                  }}
                >
                  {t('hierarchy:removeFrom', { label: hierarchyLabel })}
                </PopupList.Button>
                <PopupList.Divider />
                <PopupList.Button href={goToHref} onClick={close}>
                  <span className={`${baseClass}__truncate`} title={displayName}>
                    {t('hierarchy:goTo', { name: displayName })}
                  </span>
                </PopupList.Button>
              </PopupList.MenuItem>
            )}
            renderButton={({ active, onClick, onKeyDown }) => (
              <Button
                aria-label={displayName}
                buttonStyle="secondary"
                className={buttonClassName}
                extraButtonProps={{
                  'aria-expanded': active,
                  'aria-haspopup': 'menu',
                  onKeyDown,
                }}
                icon={SmallIcon ?? Icon}
                iconPosition="left"
                margin={false}
                onClick={onClick}
                selected={active}
                tooltip={displayName}
              >
                <span className={`${baseClass}__truncate`}>{label}</span>
              </Button>
            )}
            size="fit-content"
            verticalAlign="bottom"
          />
        ) : (
          <Button
            buttonStyle="secondary"
            className={buttonClassName}
            disabled={readOnly}
            icon={SmallIcon ?? Icon}
            iconPosition="left"
            margin={false}
            onClick={handleClick}
          >
            {label}
          </Button>
        )}
      </div>
      <HierarchyModal
        confirmLabel={t('general:confirm')}
        hasMany={hasMany}
        initialSelections={currentSelections}
        onSave={handleModalSave}
      />
    </>
  )
}
