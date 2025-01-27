import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

import type { CollectionPermission } from '../../../../auth'
import type { Fields } from '../../forms/Form/types'
import type { DocumentDrawerProps } from './types'

import { baseClass } from '.'
import { getTranslation } from '../../../../utilities/getTranslation'
import usePayloadAPI from '../../../hooks/usePayloadAPI'
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema'
import { fieldTypes } from '../../forms/field-types'
import { useRelatedCollections } from '../../forms/field-types/Relationship/AddNew/useRelatedCollections'
import X from '../../icons/X'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { DocumentInfoProvider, useDocumentInfo } from '../../utilities/DocumentInfo'
import { useLocale } from '../../utilities/Locale'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import DefaultEdit from '../../views/collections/Edit/Default'
import formatFields from '../../views/collections/Edit/formatFields'
import Button from '../Button'
import IDLabel from '../IDLabel'

const Content: React.FC<DocumentDrawerProps> = ({
  collectionSlug,
  customHeader,
  drawerSlug,
  onSave,
}) => {
  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { closeModal, modalState, toggleModal } = useModal()
  const { code: locale } = useLocale()
  const { user } = useAuth()
  const [internalState, setInternalState] = useState<Fields>()
  const { i18n, t } = useTranslation(['fields', 'general'])
  const hasInitializedState = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [collectionConfig] = useRelatedCollections(collectionSlug)
  const config = useConfig()

  const { admin: { components: { views: { Edit } = {} } = {} } = {} } = collectionConfig

  const { id, action, docPermissions, getDocPreferences } = useDocumentInfo()

  // If they are replacing the entire edit view, use that.
  // Else let the DefaultEdit determine what to render.
  const CustomEditView = typeof Edit === 'function' ? Edit : undefined

  const [fields, setFields] = useState(() => formatFields(collectionConfig, true))

  // no need to an additional requests when creating new documents
  const initialID = useRef(id)
  const [{ data, isError, isLoading: isLoadingDocument }] = usePayloadAPI(
    initialID.current ? `${serverURL}${api}/${collectionSlug}/${initialID.current}` : null,
    { initialParams: { depth: 0, draft: 'true', 'fallback-locale': 'null' } },
  )

  useEffect(() => {
    setFields(formatFields(collectionConfig, true))
  }, [collectionSlug, collectionConfig])

  useEffect(() => {
    if (isLoadingDocument || hasInitializedState.current) {
      return
    }

    const awaitInitialState = async () => {
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
        id,
        config,
        data,
        fieldSchema: fields,
        locale,
        operation: id ? 'update' : 'create',
        preferences,
        t,
        user,
      })
      setInternalState(state)
    }

    void awaitInitialState()
    hasInitializedState.current = true
  }, [data, fields, id, user, locale, isLoadingDocument, t, getDocPreferences, config])

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen))
  }, [modalState, drawerSlug])

  useEffect(() => {
    if (isOpen && !isLoadingDocument && isError) {
      closeModal(drawerSlug)
      toast.error(data.errors?.[0].message || t('error:unspecific'))
    }
  }, [isError, t, isOpen, data, drawerSlug, closeModal, isLoadingDocument])

  if (isError) return null

  const isEditing = Boolean(id)

  const apiURL = id ? `${serverURL}${api}/${collectionSlug}/${id}?locale=${locale}` : null

  const hasSavePermission =
    (isEditing && docPermissions?.update?.permission) ||
    (!isEditing && (docPermissions as CollectionPermission)?.create?.permission)

  const isLoading = !internalState || !docPermissions || isLoadingDocument

  return (
    <RenderCustomComponent
      CustomComponent={CustomEditView}
      DefaultComponent={DefaultEdit}
      componentProps={{
        id,
        action,
        apiURL,
        collection: collectionConfig,
        customHeader: (
          <div className={`${baseClass}__header`}>
            <div className={`${baseClass}__header-content`}>
              <h2 className={`${baseClass}__header-text`}>
                {!customHeader
                  ? t(!id ? 'fields:addNewLabel' : 'general:editLabel', {
                      label: getTranslation(collectionConfig.labels.singular, i18n),
                    })
                  : customHeader}
              </h2>
              <Button
                aria-label={t('general:close')}
                buttonStyle="none"
                className={`${baseClass}__header-close`}
                onClick={() => toggleModal(drawerSlug)}
              >
                <X />
              </Button>
            </div>
            {id && <IDLabel id={id.toString()} />}
          </div>
        ),
        data,
        disableActions: true,
        disableLeaveWithoutSaving: true,
        disableRoutes: true,
        fieldTypes,
        hasSavePermission,
        internalState,
        isEditing,
        isLoading,
        me: true,
        onSave,
        permissions: docPermissions,
      }}
    />
  )
}

// First provide the document context using `DocumentInfoProvider`
// this is so we can utilize the `useDocumentInfo` hook in the `Content` component
// this drawer is used for both creating and editing documents
// this means that the `id` may be unknown until the document is created
export const DocumentDrawerContent: React.FC<DocumentDrawerProps> = (props) => {
  const { id: idFromProps, collectionSlug, onSave: onSaveFromProps } = props
  const [collectionConfig] = useRelatedCollections(collectionSlug)
  const [id, setId] = useState<null | string>(idFromProps)

  const onSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      setId(args.doc.id)

      if (typeof onSaveFromProps === 'function') {
        onSaveFromProps({
          ...args,
          collectionConfig,
        })
      }
    },
    [onSaveFromProps, collectionConfig],
  )

  return (
    <DocumentInfoProvider collection={collectionConfig} id={id}>
      <Content {...props} onSave={onSave} />
    </DocumentInfoProvider>
  )
}
