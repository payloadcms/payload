'use client'

import type { FormState } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerProps } from './types.js'

import { LoadingOverlay } from '../../elements/Loading/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { DocumentInfoProvider } from '../../providers/DocumentInfo/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
import {
  buildDocumentViewClientProps,
  type SerializableDocumentViewData,
} from '../../views/Document/buildDocumentViewClientProps.js'
import { DefaultEditView } from '../../views/Edit/index.js'
import { DocumentDrawerContextProvider } from './Provider.js'

export const DocumentDrawerContent: React.FC<DocumentDrawerProps> = ({
  id: docID,
  collectionSlug,
  disableActions,
  drawerSlug,
  initialData,
  onDelete: onDeleteFromProps,
  onDuplicate: onDuplicateFromProps,
  onSave: onSaveFromProps,
  overrideEntityVisibility = true,
  redirectAfterCreate,
  redirectAfterDelete,
  redirectAfterDuplicate,
  redirectAfterRestore,
}) => {
  const { getEntityConfig } = useConfig()

  const [collectionConfig] = useState(() => getEntityConfig({ collectionSlug }))

  const abortGetDocumentViewRef = React.useRef<AbortController>(null)

  const { closeModal } = useModal()
  const { t } = useTranslation()

  const { renderDocument } = useServerFunctions()
  const { permissions } = useAuth()

  const [DocumentView, setDocumentView] = useState<React.ReactNode>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  const hasInitialized = useRef(false)

  const getDocumentView = useCallback(
    (docID?: DocumentDrawerProps['id'], showLoadingIndicator: boolean = false) => {
      const controller = handleAbortRef(abortGetDocumentViewRef)

      const fetchDocumentView = async () => {
        if (showLoadingIndicator) {
          setIsLoading(true)
        }

        try {
          const result = await renderDocument({
            collectionSlug,
            disableActions,
            docID,
            drawerSlug,
            initialData,
            overrideEntityVisibility,
            redirectAfterCreate,
            redirectAfterDelete: redirectAfterDelete !== undefined ? redirectAfterDelete : false,
            redirectAfterDuplicate:
              redirectAfterDuplicate !== undefined ? redirectAfterDuplicate : false,
            redirectAfterRestore: redirectAfterRestore !== undefined ? redirectAfterRestore : false,
            signal: controller.signal,
          })

          if (result?.Document) {
            setDocumentView(result.Document)
            setIsLoading(false)
          } else if ((result as any)?.documentViewData) {
            const documentData = (result as any).documentViewData as SerializableDocumentViewData
            const clientProps = buildDocumentViewClientProps(documentData)

            setDocumentView(
              <DocumentInfoProvider
                apiURL={documentData.apiURL}
                collectionSlug={documentData.collectionSlug}
                currentEditor={documentData.currentEditor}
                disableActions={documentData.disableActions}
                docPermissions={documentData.docPermissions}
                globalSlug={documentData.globalSlug}
                hasDeletePermission={documentData.hasDeletePermission}
                hasPublishedDoc={documentData.hasPublishedDoc}
                hasPublishPermission={documentData.hasPublishPermission}
                hasSavePermission={documentData.hasSavePermission}
                hasTrashPermission={documentData.hasTrashPermission}
                id={documentData.id}
                initialData={documentData.doc}
                initialState={documentData.formState as FormState}
                isEditing={documentData.isEditing}
                isLocked={documentData.isLocked}
                isTrashed={documentData.isTrashedDoc}
                key={`${documentData.id ?? 'create'}-${documentData.locale?.code}`}
                lastUpdateTime={documentData.lastUpdateTime ?? 0}
                mostRecentVersionIsAutosaved={documentData.mostRecentVersionIsAutosaved}
                unpublishedVersionCount={documentData.unpublishedVersionCount}
                versionCount={documentData.versionCount ?? 0}
              >
                <EditDepthProvider>
                  <DefaultEditView {...clientProps} />
                </EditDepthProvider>
              </DocumentInfoProvider>,
            )
            setIsLoading(false)
          }
        } catch (error) {
          toast.error(error?.message || t('error:unspecific'))
          closeModal(drawerSlug)
        }

        abortGetDocumentViewRef.current = null
      }

      void fetchDocumentView()
    },
    [
      collectionSlug,
      disableActions,
      drawerSlug,
      initialData,
      redirectAfterDelete,
      redirectAfterDuplicate,
      redirectAfterRestore,
      renderDocument,
      redirectAfterCreate,
      closeModal,
      overrideEntityVisibility,
      permissions,
      t,
    ],
  )

  const onSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      if (args.operation === 'create') {
        getDocumentView(args.doc.id)
      }

      if (typeof onSaveFromProps === 'function') {
        void onSaveFromProps({
          ...args,
          collectionConfig,
        })
      }
    },
    [onSaveFromProps, collectionConfig, getDocumentView],
  )

  const onDuplicate = useCallback<DocumentDrawerProps['onDuplicate']>(
    (args) => {
      getDocumentView(args.doc.id)

      if (typeof onDuplicateFromProps === 'function') {
        void onDuplicateFromProps({
          ...args,
          collectionConfig,
        })
      }
    },
    [onDuplicateFromProps, collectionConfig, getDocumentView],
  )

  const onDelete = useCallback<DocumentDrawerProps['onDelete']>(
    (args) => {
      if (typeof onDeleteFromProps === 'function') {
        void onDeleteFromProps({
          ...args,
          collectionConfig,
        })
      }

      closeModal(drawerSlug)
    },
    [onDeleteFromProps, closeModal, drawerSlug, collectionConfig],
  )

  const clearDoc = useCallback(() => {
    getDocumentView(undefined, true)
  }, [getDocumentView])

  useEffect(() => {
    if (!DocumentView && !hasInitialized.current) {
      getDocumentView(docID, true)
      hasInitialized.current = true
    }
  }, [DocumentView, getDocumentView, docID])

  // Cleanup any pending requests when the component unmounts
  useEffect(() => {
    const abortGetDocumentView = abortGetDocumentViewRef.current

    return () => {
      abortAndIgnore(abortGetDocumentView)
    }
  }, [])

  if (isLoading) {
    return <LoadingOverlay />
  }

  return (
    <DocumentDrawerContextProvider
      clearDoc={clearDoc}
      drawerSlug={drawerSlug}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onSave={onSave}
    >
      {DocumentView}
    </DocumentDrawerContextProvider>
  )
}
