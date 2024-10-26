'use client'

import { useModal } from '@faceless-ui/modal'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { DocumentDrawerProps } from './types.js'

import { LoadingOverlay } from '../../elements/Loading/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { IDLabel } from '../IDLabel/index.js'

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
  const { config } = useConfig()

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
          const { docID: newDocID, Document: DocResult } = (await serverFunction({
            name: 'render-document',
            args: {
              collectionSlug,
              disableActions,
              docID,
              drawerSlug,
              initialData,
            },
          })) as { docID: string; Document: React.ReactNode }

          setDocumentView(DocResult)
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
  ])

  // const isEditing = Boolean(docID)
  // const apiURL = docID
  //   ? `${serverURL}${apiRoute}/${collectionSlug}/${docID}${locale?.code ? `?locale=${locale.code}` : ''}`
  //   : null

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen))
  }, [modalState, drawerSlug])

  // const onSave = useCallback<DocumentDrawerProps['onSave']>(
  //   (args) => {
  //     setDocID(args.doc.id)
  //     if (typeof onSaveFromProps === 'function') {
  //       void onSaveFromProps({
  //         ...args,
  //         // collectionConfig,
  //       })
  //     }
  //   },
  //   [onSaveFromProps],
  // )

  // const onDuplicate = useCallback<DocumentDrawerProps['onSave']>(
  //   (args) => {
  //     setDocID(args.doc.id)

  //     if (typeof onDuplicateFromProps === 'function') {
  //       void onDuplicateFromProps({
  //         ...args,
  //         // collectionConfig,
  //       })
  //     }
  //   },
  //   [onDuplicateFromProps],
  // )

  // const onDelete = useCallback<DocumentDrawerProps['onDelete']>(
  //   (args) => {
  //     if (typeof onDeleteFromProps === 'function') {
  //       void onDeleteFromProps({
  //         ...args,
  //         // collectionConfig,
  //       })
  //     }

  //     closeModal(drawerSlug)
  //   },
  //   [onDeleteFromProps, closeModal, drawerSlug],
  // )

  if (isLoading) {
    return <LoadingOverlay />
  }

  return DocumentView
}

const DocumentTitle: React.FC = () => {
  const { id, title } = useDocumentInfo()
  return id && id !== title ? <IDLabel id={id.toString()} /> : null
}
