'use client'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { useForm, useFormFields } from '../../../forms/Form/context.js'
import { MoveFolderIcon } from '../../../icons/MoveFolder/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { Button } from '../../Button/index.js'
import { MoveItemsToFolderDrawer } from '../Drawers/MoveToFolder/index.js'
import './index.scss'

const baseClass = 'move-doc-to-folder'
const moveDocToFolderDrawerSlug = 'move-doc-to-folder'

export function MoveDocToFolder({ className = '' }) {
  const dispatchField = useFormFields(([_, dispatch]) => dispatch)
  const currentParentFolder = useFormFields(([fields]) => (fields && fields?._parentFolder) || null)
  const { setModified } = useForm()
  const { closeModal, openModal } = useModal()
  const { id, collectionSlug, initialData } = useDocumentInfo()

  return (
    <>
      <div className={`${baseClass} ${className}`.trim()}>
        <Button buttonStyle="none" onClick={() => openModal(moveDocToFolderDrawerSlug)}>
          <MoveFolderIcon />
        </Button>
      </div>

      <MoveItemsToFolderDrawer
        drawerSlug={moveDocToFolderDrawerSlug}
        folderID={currentParentFolder?.value as string}
        itemsToMove={[
          {
            itemKey: `${collectionSlug}-${id}`,
            relationTo: collectionSlug,
            value: { ...initialData, id } as any,
          },
        ]}
        onConfirm={(destinationFolderID) => {
          if (currentParentFolder !== destinationFolderID) {
            dispatchField({
              type: 'UPDATE',
              path: '_parentFolder',
              value: destinationFolderID,
            })
            setModified(true)
          }
          closeModal(moveDocToFolderDrawerSlug)
        }}
      />
    </>
  )
}
