'use client'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { EditDepthProvider, useEditDepth } from '../../providers/EditDepth/index.js'
import { Drawer, DrawerToggler } from '../Drawer/index.js'
import { AddFilesView } from './AddFilesView/index.js'
import { AddingFilesView } from './AddingFilesView/index.js'
import { DiscardWithoutSaving } from './DiscardWithoutSaving/index.js'
import { FormsManagerProvider, useFormsManager } from './FormsManager/index.js'

export const drawerSlug = 'bulk-upload-drawer'

function DrawerContent() {
  const { addFiles, forms } = useFormsManager()
  const { closeModal } = useModal()

  const onDrop = React.useCallback(
    (acceptedFiles: FileList) => {
      addFiles(acceptedFiles)
    },
    [addFiles],
  )

  if (!forms.length) {
    return <AddFilesView onCancel={() => closeModal(drawerSlug)} onDrop={onDrop} />
  } else {
    return <AddingFilesView />
  }
}

export type BulkUploadProps = {
  readonly children: React.ReactNode
  readonly collectionSlug: string
  readonly onSuccess: () => void
}

export function BulkUploadDrawer({ collectionSlug, onSuccess }: Omit<BulkUploadProps, 'children'>) {
  const currentDepth = useEditDepth()

  return (
    <EditDepthProvider depth={currentDepth || 1}>
      <Drawer Header={null} gutter={false} slug={drawerSlug}>
        <FormsManagerProvider collectionSlug={collectionSlug} onSuccess={onSuccess}>
          <DrawerContent />
          <DiscardWithoutSaving />
        </FormsManagerProvider>
      </Drawer>
    </EditDepthProvider>
  )
}

export function BulkUploadToggler({ children, collectionSlug, onSuccess }: BulkUploadProps) {
  return (
    <React.Fragment>
      <DrawerToggler slug={drawerSlug}>{children}</DrawerToggler>
      <BulkUploadDrawer collectionSlug={collectionSlug} onSuccess={onSuccess} />
    </React.Fragment>
  )
}
