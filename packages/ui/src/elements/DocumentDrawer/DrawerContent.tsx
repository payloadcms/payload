'use client'

import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerProps } from './types.js'

import { LoadingOverlay } from '../../elements/Loading/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { abortAndIgnore } from '../../utilities/abortAndIgnore.js'
import { DocumentDrawerContextProvider } from './Provider.js'

export const DocumentDrawerContent: React.FC<DocumentDrawerProps> = ({
  id: existingDocID,
  AfterFields,
  collectionSlug,
  disableActions,
  drawerSlug,
  Header,
  initialData,
  initialState,
  onDelete: onDeleteFromProps,
  onDuplicate: onDuplicateFromProps,
  onSave: onSaveFromProps,
  redirectAfterDelete,
  redirectAfterDuplicate,
}) => {
  const {
    config: { collections },
  } = useConfig()

  const [collectionConfig] = useState(() =>
    collections.find((collection) => collection.slug === collectionSlug),
  )

  const documentViewAbortControllerRef = React.useRef<AbortController>(null)

  const { closeModal } = useModal()
  const { t } = useTranslation()

  const { renderDocument } = useServerFunctions()

  const [DocumentView, setDocumentView] = useState<React.ReactNode>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const hasRenderedDocument = useRef(false)

  const getDocumentView = useCallback(
    (docID?: number | string) => {
      abortAndIgnore(documentViewAbortControllerRef.current)

      const controller = new AbortController()
      documentViewAbortControllerRef.current = controller

      const fetchDocumentView = async () => {
        setIsLoading(true)

        try {
          const result = await renderDocument({
            collectionSlug,
            disableActions,
            docID,
            drawerSlug,
            initialData,
            redirectAfterDelete: redirectAfterDelete !== undefined ? redirectAfterDelete : false,
            redirectAfterDuplicate:
              redirectAfterDuplicate !== undefined ? redirectAfterDuplicate : false,
            signal: controller.signal,
          })

          if (result?.Document) {
            setDocumentView(result.Document)
            setIsLoading(false)
          }
        } catch (error) {
          toast.error(error?.message || t('error:unspecific'))
          closeModal(drawerSlug)
          // toast.error(data?.errors?.[0].message || t('error:unspecific'))
        }
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
      renderDocument,
      closeModal,
      t,
    ],
  )

  const onSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      getDocumentView(args.doc.id)

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
    getDocumentView()
  }, [getDocumentView])

  useEffect(() => {
    if (!DocumentView && !hasRenderedDocument.current) {
      getDocumentView(existingDocID)
      hasRenderedDocument.current = true
    }
  }, [DocumentView, getDocumentView, existingDocID])

  // Cleanup any pending requests when the component unmounts
  useEffect(() => {
    return () => {
      abortAndIgnore(documentViewAbortControllerRef.current)
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
