'use client'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { EditDepthProvider, useEditDepth } from '../../providers/EditDepth/index.js'
import { Drawer, DrawerToggler } from '../Drawer/index.js'
import { AddFilesView } from './AddFilesView/index.js'
import { AddingFilesView } from './AddingFilesView/index.js'
import { FormsManagerProvider, useFormsManager } from './FormsManager/index.js'

function DrawerContent() {
  const { addFiles, drawerSlug, forms } = useFormsManager()
  const { closeModal } = useModal()

  const onDrop = React.useCallback(
    (acceptedFiles: FileList) => {
      void addFiles(acceptedFiles)
    },
    [addFiles],
  )

  if (!forms.length) {
    return (
      <AddFilesView
        drawerSlug={drawerSlug}
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
  readonly collectionSlug: string
  readonly drawerSlug: string
  readonly initialFiles?: FileList
  readonly onSuccess: (ids: (number | string)[]) => void
}

export function BulkUploadDrawer(props: Omit<BulkUploadProps, 'children'>) {
  const currentDepth = useEditDepth()

  return (
    <EditDepthProvider depth={currentDepth || 1}>
      <Drawer Header={null} gutter={false} slug={props.drawerSlug}>
        <FormsManagerProvider {...props}>
          <DrawerContent />
        </FormsManagerProvider>
      </Drawer>
    </EditDepthProvider>
  )
}

export function BulkUploadToggler(props: BulkUploadProps) {
  return (
    <React.Fragment>
      <DrawerToggler slug={props.drawerSlug}>{props.children}</DrawerToggler>
      <BulkUploadDrawer {...props} />
    </React.Fragment>
  )
}
