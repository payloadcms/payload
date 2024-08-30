'use client'

import type { JsonObject } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { useDrawerDepth } from '../../providers/DrawerDepth/index.js'
import { Drawer } from '../Drawer/index.js'
import { AddFilesView } from './AddFilesView/index.js'
import { AddingFilesView } from './AddingFilesView/index.js'
import { FormsManagerProvider, useFormsManager } from './FormsManager/index.js'

const drawerSlug = 'bulk-upload-drawer-slug'

function DrawerContent() {
  const { addFiles, forms, isInitializing } = useFormsManager()
  const { closeModal } = useModal()
  const { collectionSlug, drawerSlug } = useBulkUpload()

  const onDrop = React.useCallback(
    (acceptedFiles: FileList) => {
      void addFiles(acceptedFiles)
    },
    [addFiles],
  )

  if (!collectionSlug) {
    return null
  }

  if (!forms.length && !isInitializing) {
    return <AddFilesView onCancel={() => closeModal(drawerSlug)} onDrop={onDrop} />
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
  drawerSlug: string
  initialFiles: FileList
  maxFiles: number
  onCancel: () => void
  onSuccess: (newDocs: JsonObject[], errorCount: number) => void
  setCollectionSlug: (slug: string) => void
  setInitialFiles: (files: FileList) => void
  setMaxFiles: (maxFiles: number) => void
  setOnCancel: (onCancel: BulkUploadContext['onCancel']) => void
  setOnSuccess: (onSuccess: BulkUploadContext['onSuccess']) => void
}

const Context = React.createContext<BulkUploadContext>({
  collectionSlug: '',
  drawerSlug: '',
  initialFiles: undefined,
  maxFiles: undefined,
  onCancel: () => null,
  onSuccess: () => null,
  setCollectionSlug: () => null,
  setInitialFiles: () => null,
  setMaxFiles: () => null,
  setOnCancel: () => null,
  setOnSuccess: () => null,
})
export function BulkUploadProvider({ children }: { readonly children: React.ReactNode }) {
  const [collection, setCollection] = React.useState<string>()
  const [onSuccessFunction, setOnSuccessFunction] = React.useState<BulkUploadContext['onSuccess']>()
  const [onCancelFunction, setOnCancelFunction] = React.useState<BulkUploadContext['onCancel']>()
  const [initialFiles, setInitialFiles] = React.useState<FileList>(undefined)
  const [maxFiles, setMaxFiles] = React.useState<number>(undefined)
  const drawerSlug = useBulkUploadDrawerSlug()

  const setCollectionSlug: BulkUploadContext['setCollectionSlug'] = (slug) => {
    setCollection(slug)
  }

  const setOnSuccess: BulkUploadContext['setOnSuccess'] = (onSuccess) => {
    setOnSuccessFunction(() => onSuccess)
  }

  return (
    <Context.Provider
      value={{
        collectionSlug: collection,
        drawerSlug,
        initialFiles,
        maxFiles,
        onCancel: () => {
          if (typeof onCancelFunction === 'function') {
            onCancelFunction()
          }
        },
        onSuccess: (docIDs, errorCount) => {
          if (typeof onSuccessFunction === 'function') {
            onSuccessFunction(docIDs, errorCount)
          }
        },
        setCollectionSlug,
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
    </Context.Provider>
  )
}

export const useBulkUpload = () => React.useContext(Context)

export function useBulkUploadDrawerSlug() {
  const depth = useDrawerDepth()

  return `${drawerSlug}-${depth || 1}`
}
