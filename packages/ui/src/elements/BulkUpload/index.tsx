'use client'

import type { CollectionSlug, JsonObject } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { validateMimeType } from 'payload/shared'
import React, { useEffect } from 'react'
import { toast } from 'sonner'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import {
  BulkUploadControlsProvider,
  useBulkUploadControls,
} from '../../providers/BulkUploadControls/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { UploadControlsProvider } from '../../providers/UploadControls/index.js'
import { Drawer, useDrawerDepth } from '../Drawer/index.js'
import { AddFilesView } from './AddFilesView/index.js'
import { AddingFilesView } from './AddingFilesView/index.js'
import { FormsManagerProvider, type InitialForms, useFormsManager } from './FormsManager/index.js'

const drawerSlug = 'bulk-upload-drawer-slug'

function DrawerContent() {
  const { addFiles, forms, isInitializing } = useFormsManager()
  const { closeModal } = useModal()
  const { collectionSlug, drawerSlug } = useBulkUpload()
  const { getEntityConfig } = useConfig()
  const { t } = useTranslation()
  const { bulkUploadControlFiles, setBulkUploadControlFiles } = useBulkUploadControls()

  const uploadCollection = getEntityConfig({ collectionSlug })
  const uploadConfig = uploadCollection?.upload
  const uploadMimeTypes = uploadConfig?.mimeTypes

  useEffect(() => {
    if (bulkUploadControlFiles.length > 0) {
      const dataTransfer = new DataTransfer()
      bulkUploadControlFiles.forEach((file) => dataTransfer.items.add(file))

      void addFiles(dataTransfer.files)
      setBulkUploadControlFiles([])
    }
  }, [bulkUploadControlFiles, addFiles, setBulkUploadControlFiles])

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
  const {
    drawerSlug,
    onCancel,
    setInitialFiles,
    setInitialForms,
    setOnCancel,
    setOnSuccess,
    setSelectableCollections,
    setSuccessfullyUploaded,
    successfullyUploaded,
  } = useBulkUpload()
  const { modalState } = useModal()
  const previousModalStateRef = React.useRef(modalState)

  /**
   * This is used to trigger onCancel when the drawer is closed (=> forms reset, as FormsManager is unmounted)
   */
  const onModalStateChanged = useEffectEvent((modalState) => {
    const previousModalState = previousModalStateRef.current[drawerSlug]
    const currentModalState = modalState[drawerSlug]

    if (typeof currentModalState === 'undefined' && typeof previousModalState === 'undefined') {
      return
    }

    if (previousModalState?.isOpen !== currentModalState?.isOpen) {
      if (!currentModalState?.isOpen) {
        if (!successfullyUploaded) {
          // It's only cancelled if successfullyUploaded is not set. Otherwise, this would simply be a modal close after success
          // => do not call cancel, just reset everything
          if (typeof onCancel === 'function') {
            onCancel()
          }
        }

        // Reset everything to defaults
        setInitialFiles(undefined)
        setInitialForms(undefined)
        setOnCancel(() => () => null)
        setOnSuccess(() => () => null)
        setSelectableCollections(null)
        setSuccessfullyUploaded(false)
      }
    }
    previousModalStateRef.current = modalState
  })

  useEffect(() => {
    onModalStateChanged(modalState)
  }, [modalState])

  return (
    <Drawer gutter={false} Header={null} slug={drawerSlug}>
      <FormsManagerProvider>
        <BulkUploadControlsProvider>
          <UploadControlsProvider>
            <EditDepthProvider>
              <DrawerContent />
            </EditDepthProvider>
          </UploadControlsProvider>
        </BulkUploadControlsProvider>
      </FormsManagerProvider>
    </Drawer>
  )
}

export type BulkUploadContext = {
  collectionSlug: CollectionSlug
  drawerSlug: string
  initialFiles: FileList
  /**
   * Like initialFiles, but allows manually providing initial form state or the form ID for each file
   */
  initialForms: InitialForms
  maxFiles: number
  onCancel: () => void
  onSuccess: (
    uploadedForms: Array<{
      collectionSlug: CollectionSlug
      doc: JsonObject
      /**
       * ID of the form that created this document
       */
      formID: string
    }>,
    errorCount: number,
  ) => void
  /**
   * An array of collection slugs that can be selected in the collection dropdown (if applicable)
   * @default null - collection cannot be selected
   */
  selectableCollections?: null | string[]
  setCollectionSlug: (slug: string) => void
  setInitialFiles: (files: FileList) => void
  setInitialForms: (
    forms: ((forms: InitialForms | undefined) => InitialForms | undefined) | InitialForms,
  ) => void
  setMaxFiles: (maxFiles: number) => void
  setOnCancel: (onCancel: BulkUploadContext['onCancel']) => void
  setOnSuccess: (onSuccess: BulkUploadContext['onSuccess']) => void
  /**
   * Set the collections that can be selected in the collection dropdown (if applicable)
   *
   * @default null - collection cannot be selected
   */
  setSelectableCollections: (collections: null | string[]) => void
  setSuccessfullyUploaded: (successfullyUploaded: boolean) => void
  successfullyUploaded: boolean
}

const Context = React.createContext<BulkUploadContext>({
  collectionSlug: '',
  drawerSlug: '',
  initialFiles: undefined,
  initialForms: [],
  maxFiles: undefined,
  onCancel: () => null,
  onSuccess: () => null,
  selectableCollections: null,
  setCollectionSlug: () => null,
  setInitialFiles: () => null,
  setInitialForms: () => null,
  setMaxFiles: () => null,
  setOnCancel: () => null,
  setOnSuccess: () => null,
  setSelectableCollections: () => null,
  setSuccessfullyUploaded: () => false,
  successfullyUploaded: false,
})
export function BulkUploadProvider({
  children,
  drawerSlugPrefix,
}: {
  readonly children: React.ReactNode
  readonly drawerSlugPrefix?: string
}) {
  const [selectableCollections, setSelectableCollections] = React.useState<null | string[]>(null)
  const [collection, setCollection] = React.useState<string>()
  const [onSuccessFunction, setOnSuccessFunction] = React.useState<BulkUploadContext['onSuccess']>()
  const [onCancelFunction, setOnCancelFunction] = React.useState<BulkUploadContext['onCancel']>()
  const [initialFiles, setInitialFiles] = React.useState<FileList>(undefined)
  const [initialForms, setInitialForms] = React.useState<InitialForms>(undefined)
  const [maxFiles, setMaxFiles] = React.useState<number>(undefined)
  const [successfullyUploaded, setSuccessfullyUploaded] = React.useState<boolean>(false)

  const drawerSlug = `${drawerSlugPrefix ? `${drawerSlugPrefix}-` : ''}${useBulkUploadDrawerSlug()}`

  const setOnSuccess: BulkUploadContext['setOnSuccess'] = (onSuccess) => {
    setOnSuccessFunction(() => onSuccess)
  }
  const setOnCancel: BulkUploadContext['setOnCancel'] = (onCancel) => {
    setOnCancelFunction(() => onCancel)
  }

  return (
    <Context
      value={{
        collectionSlug: collection,
        drawerSlug,
        initialFiles,
        initialForms,
        maxFiles,
        onCancel: () => {
          if (typeof onCancelFunction === 'function') {
            onCancelFunction()
          }
        },
        onSuccess: (newDocs, errorCount) => {
          if (typeof onSuccessFunction === 'function') {
            onSuccessFunction(newDocs, errorCount)
          }
        },
        selectableCollections,
        setCollectionSlug: setCollection,
        setInitialFiles,
        setInitialForms,
        setMaxFiles,
        setOnCancel,
        setOnSuccess,
        setSelectableCollections,
        setSuccessfullyUploaded,
        successfullyUploaded,
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
