'use client'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'
import { toast } from 'sonner'

import { useForm, useFormFields } from '../../../forms/Form/context.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { MoveItemsToFolderDrawer } from '../Drawers/MoveToFolder/index.js'
import './index.scss'

const baseClass = 'move-doc-to-folder'
const moveDocToFolderDrawerSlug = 'move-doc-to-folder'

export function MoveDocToFolder({ className = '' }) {
  const dispatchField = useFormFields(([_, dispatch]) => dispatch)
  const { i18n, t } = useTranslation()
  const currentParentFolder = useFormFields(([fields]) => (fields && fields?._folder) || null)
  const { setModified } = useForm()
  const { closeModal, openModal } = useModal()
  const { id, collectionSlug, initialData, title } = useDocumentInfo()
  const { config, getEntityConfig } = useConfig()
  const [folderName, setFolderName] = React.useState(() => `${t('general:loading')}...`)

  React.useEffect(() => {
    async function fetchFolderLabel() {
      if (
        currentParentFolder?.value &&
        (typeof currentParentFolder.value === 'string' ||
          typeof currentParentFolder.value === 'number')
      ) {
        const response = await fetch(`/api/${config.folders.slug}/${currentParentFolder.value}`)
        const folderData = await response.json()
        setFolderName(folderData?.name || t('folder:noFolder'))
      }
    }

    void fetchFolderLabel()
  }, [config.folders.slug, currentParentFolder, t])

  return (
    <>
      <div className={`${baseClass} ${className}`.trim()}>
        <Button
          buttonStyle="subtle"
          className={`${baseClass}__move-to-folder-btn`}
          icon={<FolderIcon />}
          iconPosition="left"
          onClick={() => openModal(moveDocToFolderDrawerSlug)}
        >
          {currentParentFolder?.value ? folderName : t('folder:noFolder')}
        </Button>
      </div>

      <MoveItemsToFolderDrawer
        action="moveItemToFolder"
        drawerSlug={moveDocToFolderDrawerSlug}
        folderID={currentParentFolder?.value as string}
        fromFolderName={folderName}
        itemsToMove={[
          {
            itemKey: `${collectionSlug}-${id}`,
            relationTo: collectionSlug,
            value: { ...initialData, id } as any,
          },
        ]}
        onConfirm={({ id, name }) => {
          if (currentParentFolder !== id) {
            dispatchField({
              type: 'UPDATE',
              path: '_folder',
              value: id,
            })
            setModified(true)

            if (id) {
              // moved to folder
              toast.success(
                t('folder:itemHasBeenMoved', {
                  folderName: `"${name}"`,
                  title,
                }),
              )
            } else {
              // moved to root
              toast.success(
                t('folder:itemHasBeenMovedToRoot', {
                  title,
                }),
              )
            }
          }
          closeModal(moveDocToFolderDrawerSlug)
        }}
        skipConfirmModal={!currentParentFolder?.value}
        title={
          title === `[${t('general:untitled')}]`
            ? getTranslation(getEntityConfig({ collectionSlug }).labels.singular, i18n)
            : title
        }
      />
    </>
  )
}
