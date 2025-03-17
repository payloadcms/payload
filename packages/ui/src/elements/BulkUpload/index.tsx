'use client'

import type { JsonObject } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { validateMimeType } from 'payload/shared'
import React from 'react'
import { toast } from 'sonner'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Drawer, useDrawerDepth } from '../Drawer/index.js'
import { AddFilesView } from './AddFilesView/index.js'
import { AddingFilesView } from './AddingFilesView/index.js'
import { FormsManagerProvider, useFormsManager } from './FormsManager/index.js'

const drawerSlug = 'bulk-upload-drawer-slug'

function DrawerContent() {
  const { addFiles, forms, isInitializing } = useFormsManager()
  const { closeModal } = useModal()
  const { collectionSlug, drawerSlug } = useBulkUpload()
  const { getEntityConfig } = useConfig()
  const { t } = useTranslation()

  const uploadCollection = getEntityConfig({ collectionSlug })
  const uploadConfig = uploadCollection?.upload
  const uploadMimeTypes = uploadConfig?.mimeTypes

  const onDrop = React.useCallback(
    (acceptedFiles: FileList) => {
      const fileTransfer = new DataTransfer()
      for (const candidateFile of acceptedFiles) {
        if (
          uploadMimeTypes === undefined ||
          uploadMimeTypes.length === 0 ||
          validateMimeType(candidateFile.type, uploadMimeTypes)
        ) {
          fileTransfer.items.add(candidateFile)
        }
      }
      if (fileTransfer.files.length === 0) {
        toast.error(t('error:invalidFileType'))
      } else {
        void addFiles(fileTransfer.files)
      }
    },
    [addFiles, t, uploadMimeTypes],
  )

  if (!collectionSlug) {
    return null
  }

  if (!forms.length && !isInitializing) {
    return (
      <AddFilesView
        acceptMimeTypes={uploadMimeTypes?.join(', ')}
        onCancel={() => closeModal(drawerSlug)}
        onDrop={onDrop}
      />
    )
  } else {
    return <AddingFilesView />
  }
}

export type BulkUploadProps = {
  readonly children: React.ReactNode
}

export function BulkUploadDrawer() {
  const { drawerSlug } = useBulkUpload()

  return (
    <Drawer gutter={false} Header={null} slug={drawerSlug}>
      <FormsManagerProvider>
        <DrawerContent />
      </FormsManagerProvider>
    </Drawer>
  )
}

type BulkUploadContext = {
  collectionSlug: string
  currentActivePath: string
  drawerSlug: string
  initialFiles: FileList
  maxFiles: number
  onCancel: () => void
  onSuccess: (newDocs: JsonObject[], errorCount: number) => void
  setCollectionSlug: (slug: string) => void
  setCurrentActivePath: (path: string) => void
  setInitialFiles: (files: FileList) => void
  setMaxFiles: (maxFiles: number) => void
  setOnCancel: (onCancel: BulkUploadContext['onCancel']) => void
  setOnSuccess: (path: string, onSuccess: BulkUploadContext['onSuccess']) => void
}

const Context = React.createContext<BulkUploadContext>({
  collectionSlug: '',
  currentActivePath: undefined,
  drawerSlug: '',
  initialFiles: undefined,
  maxFiles: undefined,
  onCancel: () => null,
  onSuccess: () => null,
  setCollectionSlug: () => null,
  setCurrentActivePath: () => null,
  setInitialFiles: () => null,
  setMaxFiles: () => null,
  setOnCancel: () => null,
  setOnSuccess: () => null,
})
export function BulkUploadProvider({ children }: { readonly children: React.ReactNode }) {
  const [collection, setCollection] = React.useState<string>()
  const [onSuccessFunctionMap, setOnSuccessFunctionMap] =
    React.useState<Record<string, BulkUploadContext['onSuccess']>>()
  const [onCancelFunction, setOnCancelFunction] = React.useState<BulkUploadContext['onCancel']>()
  const [initialFiles, setInitialFiles] = React.useState<FileList>(undefined)
  const [maxFiles, setMaxFiles] = React.useState<number>(undefined)
  const [currentActivePath, setCurrentActivePath] = React.useState<string>(undefined)
  const drawerSlug = useBulkUploadDrawerSlug()

  const setCollectionSlug: BulkUploadContext['setCollectionSlug'] = (slug) => {
    setCollection(slug)
  }

  const setOnSuccess: BulkUploadContext['setOnSuccess'] = React.useCallback((path, onSuccess) => {
    setOnSuccessFunctionMap((prev) => ({
      ...prev,
      [path]: onSuccess,
    }))
  }, [])

  return (
    <Context
      value={{
        collectionSlug: collection,
        currentActivePath,
        drawerSlug,
        initialFiles,
        maxFiles,
        onCancel: () => {
          if (typeof onCancelFunction === 'function') {
            onCancelFunction()
          }
        },
        onSuccess: (docIDs, errorCount) => {
          if (onSuccessFunctionMap && Object.hasOwn(onSuccessFunctionMap, currentActivePath)) {
            const onSuccessFunction = onSuccessFunctionMap[currentActivePath]
            onSuccessFunction(docIDs, errorCount)
          }
        },
        setCollectionSlug,
        setCurrentActivePath,
        setInitialFiles,
        setMaxFiles,
        setOnCancel: setOnCancelFunction,
        setOnSuccess,
      }}
    >
      <React.Fragment>
        {children}
        <BulkUploadDrawer />
      </React.Fragment>
    </Context>
  )
}

export const useBulkUpload = () => React.use(Context)

export function useBulkUploadDrawerSlug() {
  const depth = useDrawerDepth()

  return `${drawerSlug}-${depth || 1}`
}
