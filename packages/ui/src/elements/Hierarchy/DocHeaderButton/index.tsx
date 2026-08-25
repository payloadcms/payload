'use client'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { SelectionWithPath } from '../Modal/types.js'

import { useForm, useFormFields } from '../../../forms/Form/context.js'
import { ArrowIcon } from '../../../icons/Arrow/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useDocumentTitle } from '../../../providers/DocumentTitle/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
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
  const { collectionSlug: documentCollectionSlug } = useDocumentInfo()
  const { title: documentTitle } = useDocumentTitle()
  const { disabled: formDisabled, setModified } = useForm()
  const readOnly = readOnlyFromProps || formDisabled
  const dispatchField = useFormFields(([_, dispatch]) => dispatch)

  const currentFieldValue = useFormFields(([fields]) => (fields && fields?.[fieldName]) || null)
  const currentId = currentFieldValue?.value as null | number | string

  const [displayName, setDisplayName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const collectionConfig = getEntityConfig({ collectionSlug: hierarchyCollectionSlug })
  const useAsTitle = collectionConfig?.admin?.useAsTitle || 'name'
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined

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

  // A single value is required to name the folder in the menu, so `hasMany` fields keep the
  // plain button that opens the move modal directly.
  const hasSingleFolder =
    !hasMany && (typeof currentId === 'string' || typeof currentId === 'number')

  const label = isLoading ? `${t('general:loading')}...` : displayName

  // e.g. "Folder" / "Tag" - the hierarchy collection this document is filed under.
  const hierarchyLabel = getTranslation(collectionConfig?.labels?.singular, i18n)
  const emptyLabel = `${t('general:no')} ${hierarchyLabel}`

  const controlRef = useRef<HTMLDivElement | null>(null)
  const [shouldRefocus, setShouldRefocus] = useState(false)

  // Removal swaps the menu trigger out for the plain button, so focus is restored once the
  // replacement has rendered rather than on the element that is about to unmount.
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
    if (!hasSingleFolder || !documentCollectionSlug) {
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
    hasSingleFolder,
    hierarchyConfig?.parentFieldName,
  ])

  const buttonClassName = [baseClass, readOnly && `${baseClass}--read-only`]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div className={`${baseClass}__control`} ref={controlRef}>
        {hasSingleFolder && !readOnly ? (
          <Popup
            caret={false}
            className={`${baseClass}__popup`}
            horizontalAlign="left"
            portalClassName={`${baseClass}__popup-content`}
            render={({ close }) => (
              <PopupList.MenuItem>
                <PopupList.Button
                  icon={<ArrowIcon direction="right" />}
                  onClick={() => {
                    close()
                    openModal()
                  }}
                >
                  Move to...
                </PopupList.Button>
                <PopupList.Button
                  icon={<XIcon />}
                  onClick={() => {
                    close()
                    handleRemove()
                  }}
                >
                  {`Remove from ${hierarchyLabel}`}
                </PopupList.Button>
                <PopupList.Divider />
                <PopupList.Button href={goToHref} icon={<FolderIcon />} onClick={close}>
                  <span className={`${baseClass}__truncate`} title={displayName}>
                    {`Go to ${displayName}`}
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
            {currentId ? label : emptyLabel}
          </Button>
        )}
      </div>
      <HierarchyModal
        hasMany={hasMany}
        initialSelections={currentId ? [currentId] : undefined}
        onSave={handleModalSave}
        title={!hasMany && documentTitle ? `${t('general:move')} "${documentTitle}"` : undefined}
      />
    </>
  )
}
