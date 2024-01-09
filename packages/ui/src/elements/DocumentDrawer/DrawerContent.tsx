import { useModal } from '@faceless-ui/modal'
import queryString from 'qs'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

import type { CollectionPermission } from 'payload/auth'
import type { Fields } from '../../forms/Form/types'
import type { DocumentDrawerProps } from './types'

import { baseClass } from '.'
import { getTranslation } from '@payloadcms/translations'
import usePayloadAPI from '../../hooks/usePayloadAPI'
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema'
import { fieldTypes } from '../../forms/field-types'
import { useRelatedCollections } from '../../forms/field-types/Relationship/AddNew/useRelatedCollections'
import { X } from '../../icons/X'
import { useAuth } from '../../providers/Auth'
import { useConfig } from '../../providers/Config'
import { useTranslation } from '../../providers/Translation'
import { DocumentInfoProvider, useDocumentInfo } from '../../providers/DocumentInfo'
import { useFormQueryParams } from '../../providers/FormQueryParams'
import { useLocale } from '../../providers/Locale'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'
// import DefaultEdit from '../../views/collections/Edit/Default'
import { formatFields } from '../../utilities/formatFields'
import { Button } from '../Button'
import IDLabel from '../IDLabel'

const Content: React.FC<DocumentDrawerProps> = ({
  collectionSlug,
  customHeader,
  drawerSlug,
  onSave,
}) => {
  const config = useConfig()

  const {
    routes: { api },
    serverURL,
  } = config

  const { closeModal, modalState, toggleModal } = useModal()
  const { code: locale } = useLocale()
  const { user } = useAuth()
  const [internalState, setInternalState] = useState<Fields>()
  const { i18n, t } = useTranslation()
  const hasInitializedState = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [collectionConfig] = useRelatedCollections(collectionSlug)
  const { formQueryParams } = useFormQueryParams()
  const formattedQueryParams = queryString.stringify(formQueryParams)

  const { admin: { components: { views: { Edit } = {} } = {} } = {}, fields: fieldsFromConfig } =
    collectionConfig

  const { id, docPermissions, getDocPreferences } = useDocumentInfo()

  // The component definition could come from multiple places in the config
  // we need to cascade into the proper component from the top-down
  // 1. "components.Edit"
  // 2. "components.Edit.Default"
  // 3. "components.Edit.Default.Component"
  const CustomEditView =
    typeof Edit === 'function'
      ? Edit
      : typeof Edit === 'object' && typeof Edit.Default === 'function'
      ? Edit.Default
      : typeof Edit?.Default === 'object' &&
        'Component' in Edit.Default &&
        typeof Edit.Default.Component === 'function'
      ? Edit.Default.Component
      : undefined

  const [fields, setFields] = useState(() => formatFields(fieldsFromConfig, true))

  // no need to an additional requests when creating new documents
  const initialID = useRef(id)
  const [{ data, isError, isLoading: isLoadingDocument }] = usePayloadAPI(
    initialID.current ? `${serverURL}${api}/${collectionSlug}/${initialID.current}` : null,
    { initialParams: { depth: 0, draft: 'true', 'fallback-locale': 'null' } },
  )

  useEffect(() => {
    setFields(formatFields(fields, true))
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

    awaitInitialState()
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

  const action = `${serverURL}${api}/${collectionSlug}${
    isEditing ? `/${id}` : ''
  }?${formattedQueryParams}`

  const hasSavePermission =
    (isEditing && docPermissions?.update?.permission) ||
    (!isEditing && (docPermissions as CollectionPermission)?.create?.permission)

  const isLoading = !internalState || !docPermissions || isLoadingDocument

  return (
    <RenderCustomComponent
      CustomComponent={CustomEditView}
      // DefaultComponent={DefaultEdit}
      DefaultComponent={null}
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
