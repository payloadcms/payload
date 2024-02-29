'use client'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import queryString from 'qs'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

import type { FormState } from '../../forms/Form/types'
import type { DocumentDrawerProps } from './types'

import { baseClass } from '.'
import { FieldPathProvider, useFieldPath } from '../../forms/FieldPathProvider'
import { useRelatedCollections } from '../../forms/fields/Relationship/AddNew/useRelatedCollections'
import usePayloadAPI from '../../hooks/usePayloadAPI'
import { X } from '../../icons/X'
import { useComponentMap } from '../../providers/ComponentMapProvider'
import { useConfig } from '../../providers/Config'
import { DocumentInfoProvider } from '../../providers/DocumentInfo'
import { useFormQueryParams } from '../../providers/FormQueryParams'
import { useLocale } from '../../providers/Locale'
import { useTranslation } from '../../providers/Translation'
import { formatFields } from '../../utilities/formatFields'
import { getFormState } from '../../utilities/getFormState'
import { Gutter } from '../Gutter'
import IDLabel from '../IDLabel'
import { LoadingOverlay } from '../Loading'

const Content: React.FC<DocumentDrawerProps> = ({
  id,
  Header,
  collectionSlug,
  drawerSlug,
  onSave,
}) => {
  const config = useConfig()

  const {
    routes: { api: apiRoute },
    serverURL,
  } = config

  const { closeModal, modalState, toggleModal } = useModal()
  const locale = useLocale()
  const [initialState, setInitialState] = useState<FormState>()
  const { i18n, t } = useTranslation()
  const hasInitializedState = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [collectionConfig] = useRelatedCollections(collectionSlug)
  const { formQueryParams } = useFormQueryParams()
  const formattedQueryParams = queryString.stringify(formQueryParams)

  const { fields: fieldsFromConfig } = collectionConfig

  const { schemaPath } = useFieldPath()

  const { componentMap } = useComponentMap()

  const { Edit } = componentMap[`${collectionSlug ? 'collections' : 'globals'}`][collectionSlug]

  const [fields, setFields] = useState(() => formatFields(fieldsFromConfig, true))

  // no need to an additional requests when creating new documents
  const initialID = useRef(id)

  const [{ data, isError, isLoading: isLoadingDocument }] = usePayloadAPI(
    initialID.current ? `${serverURL}${apiRoute}/${collectionSlug}/${initialID.current}` : null,
    { initialParams: { depth: 0, draft: 'true', 'fallback-locale': 'null' } },
  )

  useEffect(() => {
    setFields(formatFields(fields, true))
  }, [collectionSlug, collectionConfig, fields])

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen))
  }, [modalState, drawerSlug])

  useEffect(() => {
    if (isOpen && !isLoadingDocument && isError) {
      closeModal(drawerSlug)
      toast.error(data.errors?.[0].message || t('error:unspecific'))
    }
  }, [isError, t, isOpen, data, drawerSlug, closeModal, isLoadingDocument])

  const isEditing = Boolean(id)

  const apiURL = id ? `${serverURL}${apiRoute}/${collectionSlug}/${id}?locale=${locale.code}` : null

  const action = `${serverURL}${apiRoute}/${collectionSlug}${
    isEditing ? `/${id}` : ''
  }?${formattedQueryParams}`

  // const hasSavePermission =
  //   (isEditing && docPermissions?.update?.permission) ||
  //   (!isEditing && (docPermissions as CollectionPermission)?.create?.permission)

  useEffect(() => {
    if (!hasInitializedState.current && (!initialID.current || (initialID.current && data))) {
      const getInitialState = async () => {
        const result = await getFormState({
          apiRoute,
          body: {
            id,
            collectionSlug,
            data: data || {},
            operation: isEditing ? 'update' : 'create',
            schemaPath,
          },
          serverURL,
        })

        setInitialState(result)
        hasInitializedState.current = true
      }

      void getInitialState()
    }
  }, [apiRoute, data, id, isEditing, schemaPath, serverURL, collectionSlug])

  if (isError) return null

  if (!initialState || isLoadingDocument) {
    return <LoadingOverlay />
  }

  return (
    <DocumentInfoProvider
      BeforeDocument={
        <Gutter className={`${baseClass}__header`}>
          <div className={`${baseClass}__header-content`}>
            <h2 className={`${baseClass}__header-text`}>
              {Header ||
                t(!id ? 'fields:addNewLabel' : 'general:editLabel', {
                  label: getTranslation(collectionConfig.labels.singular, i18n),
                })}
            </h2>
            {/* TODO: the `button` HTML element breaks CSS transitions on the drawer for some reason...
            i.e. changing to a `div` element will fix the animation issue but will break accessibility
          */}
            <button
              aria-label={t('general:close')}
              className={`${baseClass}__header-close`}
              onClick={() => toggleModal(drawerSlug)}
              type="button"
            >
              <X />
            </button>
          </div>
          {id && <IDLabel id={id.toString()} />}
        </Gutter>
      }
      action={action}
      apiURL={apiURL}
      collectionSlug={collectionConfig.slug}
      disableActions
      disableLeaveWithoutSaving
      // hasSavePermission={hasSavePermission}
      // isEditing={isEditing}
      // isLoading,
      id={id}
      initialData={data}
      initialState={initialState}
      // me: true,
      onSave={onSave}
    >
      {Edit}
    </DocumentInfoProvider>
  )
}

// First provide the document context using `DocumentInfoProvider`
// this is so we can utilize the `useDocumentInfo` hook in the `Content` component
// this drawer is used for both creating and editing documents
// this means that the `id` may be unknown until the document is created
export const DocumentDrawerContent: React.FC<DocumentDrawerProps> = (props) => {
  const { id: idFromProps, collectionSlug, onSave: onSaveFromProps } = props
  const [collectionConfig] = useRelatedCollections(collectionSlug)
  const [id, setId] = useState<null | number | string>(idFromProps)

  const onSave = useCallback<DocumentDrawerProps['onSave']>(
    async (args) => {
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
    <FieldPathProvider path="" schemaPath={collectionSlug}>
      <Content {...props} id={id} onSave={onSave} />
    </FieldPathProvider>
  )
}
