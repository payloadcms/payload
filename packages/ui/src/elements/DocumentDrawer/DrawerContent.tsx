'use client'

import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerProps } from './types.js'

import { LoadingOverlay } from '../../elements/Loading/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
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

  const { closeModal, modalState, toggleModal } = useModal()
  const locale = useLocale()
  const { t } = useTranslation()
  const [docID, setDocID] = useState(existingDocID)
  const [isOpen, setIsOpen] = useState(false)

  const { serverFunction } = useServerFunctions()

  const [DocumentView, setDocumentView] = useState<React.ReactNode>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!DocumentView) {
      const getDocumentView = async () => {
        try {
          const { docID: newDocID, Document: ViewResult } = (await serverFunction({
            name: 'render-document',
            args: {
              collectionSlug,
              disableActions,
              docID,
              drawerSlug,
              initialData,
              redirectAfterDelete,
              redirectAfterDuplicate,
            },
          })) as { docID: string; Document: React.ReactNode }

          setDocumentView(ViewResult)
          setDocID(newDocID)
          setIsLoading(false)
        } catch (error) {
          if (isOpen) {
            closeModal(drawerSlug)
            toast.error(error?.message || t('error:unspecific'))
            // toast.error(data?.errors?.[0].message || t('error:unspecific'))
          }
        }
      }

      void getDocumentView()
    }
  }, [
    serverFunction,
    collectionSlug,
    docID,
    DocumentView,
    closeModal,
    drawerSlug,
    isOpen,
    t,
    disableActions,
    initialData,
    redirectAfterDelete,
    redirectAfterDuplicate,
  ])

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen))
  }, [modalState, drawerSlug])

  const onSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      setDocID(args.doc.id)
      if (typeof onSaveFromProps === 'function') {
        void onSaveFromProps({
          ...args,
          collectionConfig,
        })
      }
    },
    [onSaveFromProps, collectionConfig],
  )

  const onDuplicate = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      setDocID(args.doc.id)

      if (typeof onDuplicateFromProps === 'function') {
        void onDuplicateFromProps({
          ...args,
          collectionConfig,
        })
      }
    },
    [onDuplicateFromProps, collectionConfig],
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

  if (isLoading) {
    return <LoadingOverlay />
  }

  return (
    <DocumentDrawerContextProvider
      drawerSlug={drawerSlug}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onSave={onSave}
    >
      {DocumentView}
    </DocumentDrawerContextProvider>
  )
}
