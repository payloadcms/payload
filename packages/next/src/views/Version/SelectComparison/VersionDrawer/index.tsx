'use client'
import {
  Drawer,
  LoadingOverlay,
  toast,
  useDocumentInfo,
  useEditDepth,
  useModal,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation.js'

import './index.scss'

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

export const baseClass = 'version-drawer'
export const formatVersionDrawerSlug = ({
  depth,
  uuid,
}: {
  depth: number
  uuid: string // supply when creating a new document and no id is available
}) => `version-drawer_${depth}_${uuid}`

export const VersionDrawerContent: React.FC<{
  collectionSlug?: string
  docID?: number | string
  drawerSlug: string
  globalSlug?: string
}> = (props) => {
  const { collectionSlug, docID, drawerSlug, globalSlug } = props
  const { isTrashed } = useDocumentInfo()
  const { closeModal } = useModal()
  const searchParams = useSearchParams()
  const prevSearchParams = useRef(searchParams)

  const { renderDocument } = useServerFunctions()

  const [DocumentView, setDocumentView] = useState<React.ReactNode>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const hasRenderedDocument = useRef(false)
  const { t } = useTranslation()

  const getDocumentView = useCallback(
    (docID?: number | string) => {
      const fetchDocumentView = async () => {
        setIsLoading(true)

        try {
          const isGlobal = Boolean(globalSlug)
          const entitySlug = collectionSlug ?? globalSlug

          const result = await renderDocument({
            collectionSlug: entitySlug,
            docID,
            drawerSlug,
            paramsOverride: {
              segments: [
                isGlobal ? 'globals' : 'collections',
                entitySlug,
                ...(isTrashed ? ['trash'] : []),
                isGlobal ? undefined : String(docID),
                'versions',
              ].filter(Boolean),
            },
            redirectAfterDelete: false,
            redirectAfterDuplicate: false,
            searchParams: Object.fromEntries(searchParams.entries()),
            versions: {
              disableGutter: true,
              useVersionDrawerCreatedAtCell: true,
            },
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
      closeModal,
      collectionSlug,
      drawerSlug,
      globalSlug,
      isTrashed,
      renderDocument,
      searchParams,
      t,
    ],
  )

  useEffect(() => {
    if (!hasRenderedDocument.current || prevSearchParams.current !== searchParams) {
      prevSearchParams.current = searchParams
      getDocumentView(docID)
      hasRenderedDocument.current = true
    }
  }, [docID, getDocumentView, searchParams])

  if (isLoading) {
    return <LoadingOverlay />
  }

  return DocumentView
}
export const VersionDrawer: React.FC<{
  collectionSlug?: string
  docID?: number | string
  drawerSlug: string
  globalSlug?: string
}> = (props) => {
  const { collectionSlug, docID, drawerSlug, globalSlug } = props
  const { t } = useTranslation()

  return (
    <Drawer
      className={baseClass}
      gutter={true}
      slug={drawerSlug}
      title={t('version:selectVersionToCompare')}
    >
      <VersionDrawerContent
        collectionSlug={collectionSlug}
        docID={docID}
        drawerSlug={drawerSlug}
        globalSlug={globalSlug}
      />
    </Drawer>
  )
}

export const useVersionDrawer = ({
  collectionSlug,
  docID,
  globalSlug,
}: {
  collectionSlug?: string
  docID?: number | string
  globalSlug?: string
}) => {
  const drawerDepth = useEditDepth()
  const uuid = useId()
  const { closeModal, modalState, openModal, toggleModal } = useModal()
  const [isOpen, setIsOpen] = useState(false)

  const drawerSlug = formatVersionDrawerSlug({
    depth: drawerDepth,
    uuid,
  })

  useEffect(() => {
    setIsOpen(Boolean(modalState[drawerSlug]?.isOpen))
  }, [modalState, drawerSlug])

  const toggleDrawer = useCallback(() => {
    toggleModal(drawerSlug)
  }, [toggleModal, drawerSlug])

  const closeDrawer = useCallback(() => {
    closeModal(drawerSlug)
  }, [drawerSlug, closeModal])

  const openDrawer = useCallback(() => {
    openModal(drawerSlug)
  }, [drawerSlug, openModal])

  const MemoizedDrawer = useMemo(() => {
    return () => (
      <VersionDrawer
        collectionSlug={collectionSlug}
        docID={docID}
        drawerSlug={drawerSlug}
        globalSlug={globalSlug}
      />
    )
  }, [collectionSlug, docID, drawerSlug, globalSlug])

  return useMemo(
    () => ({
      closeDrawer,
      Drawer: MemoizedDrawer,
      drawerDepth,
      drawerSlug,
      isDrawerOpen: isOpen,
      openDrawer,
      toggleDrawer,
    }),
    [MemoizedDrawer, closeDrawer, drawerDepth, drawerSlug, isOpen, openDrawer, toggleDrawer],
  )
}
