'use client'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@ruya.sa/translations'
import { type FolderOrDocument, formatAdminURL } from '@ruya.sa/payload/shared'
import React, { useId } from 'react'
import { toast } from 'sonner'

import type { Props as ButtonProps } from '../../Button/types.js'

import { useForm, useFormFields } from '../../../forms/Form/context.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { formatDrawerSlug, useDrawerDepth } from '../../Drawer/index.js'
import './index.scss'
import { MoveItemsToFolderDrawer } from '../Drawers/MoveToFolder/index.js'

const baseClass = 'move-doc-to-folder'

/**
 * This is the button shown on the edit document view. It uses the more generic `MoveDocToFolderButton` component.
 */
export function MoveDocToFolder({
  buttonProps,
  className = '',
  folderCollectionSlug,
  folderFieldName,
}: {
  readonly buttonProps?: Partial<ButtonProps>
  readonly className?: string
  readonly folderCollectionSlug: string
  readonly folderFieldName: string
}) {
  const { t } = useTranslation()
  const dispatchField = useFormFields(([_, dispatch]) => dispatch)
  const currentParentFolder = useFormFields(
    ([fields]) => (fields && fields?.[folderFieldName]) || null,
  )
  const fromFolderID = currentParentFolder?.value
  const { id, collectionSlug, initialData, title } = useDocumentInfo()
  const { setModified } = useForm()
  const [fromFolderName, setFromFolderName] = React.useState(() => `${t('general:loading')}...`)

  const { config } = useConfig()
  const modalID = useId()

  React.useEffect(() => {
    async function fetchFolderLabel() {
      if (fromFolderID && (typeof fromFolderID === 'string' || typeof fromFolderID === 'number')) {
        const response = await fetch(
          formatAdminURL({
            apiRoute: config.routes.api,
            path: `/${folderCollectionSlug}/${fromFolderID}`,
          }),
        )
        const folderData = await response.json()
        setFromFolderName(folderData?.name || t('folder:noFolder'))
      } else {
        setFromFolderName(t('folder:noFolder'))
      }
    }

    void fetchFolderLabel()
  }, [folderCollectionSlug, config.routes.api, fromFolderID, t])

  return (
    <MoveDocToFolderButton
      buttonProps={buttonProps}
      className={className}
      collectionSlug={collectionSlug}
      docData={initialData as FolderOrDocument['value']}
      docID={id}
      docTitle={title}
      folderCollectionSlug={folderCollectionSlug}
      folderFieldName={folderFieldName}
      fromFolderID={fromFolderID as number | string}
      fromFolderName={fromFolderName}
      modalSlug={`move-to-folder-${modalID}`}
      onConfirm={({ id }) => {
        if (currentParentFolder.value !== id) {
          dispatchField({
            type: 'UPDATE',
            path: folderFieldName,
            value: id,
          })
          setModified(true)
        }
      }}
      skipConfirmModal={!currentParentFolder?.value}
    />
  )
}

type MoveDocToFolderButtonProps = {
  readonly buttonProps?: Partial<ButtonProps>
  readonly className?: string
  readonly collectionSlug: string
  readonly docData: FolderOrDocument['value']
  readonly docID: number | string
  readonly docTitle?: string
  readonly folderCollectionSlug: string
  readonly folderFieldName: string
  readonly fromFolderID?: number | string
  readonly fromFolderName: string
  readonly modalSlug: string
  readonly onConfirm?: (args: { id: number | string; name: string }) => Promise<void> | void
  readonly skipConfirmModal?: boolean
}

/**
 * This is a more generic button that can be used in other contexts, such as table cells and the edit view.
 */
export const MoveDocToFolderButton = ({
  buttonProps,
  className,
  collectionSlug,
  docData,
  docID,
  docTitle,
  folderCollectionSlug,
  folderFieldName,
  fromFolderID,
  fromFolderName,
  modalSlug,
  onConfirm,
  skipConfirmModal,
}: MoveDocToFolderButtonProps) => {
  const { getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const { closeModal, openModal } = useModal()
  const drawerDepth = useDrawerDepth()
  const drawerSlug = formatDrawerSlug({ slug: modalSlug, depth: drawerDepth })

  const titleToRender =
    docTitle || getTranslation(getEntityConfig({ collectionSlug }).labels.singular, i18n)

  return (
    <>
      <Button
        buttonStyle="subtle"
        className={[baseClass, className].filter(Boolean).join(' ')}
        icon={<FolderIcon />}
        iconPosition="left"
        onClick={() => {
          openModal(drawerSlug)
        }}
        {...buttonProps}
      >
        {fromFolderName}
      </Button>

      <MoveItemsToFolderDrawer
        action="moveItemToFolder"
        drawerSlug={drawerSlug}
        //todo this should inherit
        folderAssignedCollections={[collectionSlug]}
        folderCollectionSlug={folderCollectionSlug}
        folderFieldName={folderFieldName}
        fromFolderID={fromFolderID}
        fromFolderName={fromFolderName}
        itemsToMove={[
          {
            itemKey: `${collectionSlug}-${docID}`,
            relationTo: collectionSlug,
            value: { ...docData, id: docID },
          },
        ]}
        onConfirm={async (args) => {
          if (fromFolderID !== args.id && typeof onConfirm === 'function') {
            try {
              await onConfirm(args)

              if (args.id) {
                // moved to folder
                toast.success(
                  t('folder:itemHasBeenMoved', {
                    folderName: `"${args.name}"`,
                    title: titleToRender,
                  }),
                )
              } else {
                // moved to root
                toast.success(
                  t('folder:itemHasBeenMovedToRoot', {
                    title: titleToRender,
                  }),
                )
              }
            } catch (_) {
              // todo: add error toast?
            }
          }

          closeModal(drawerSlug)
        }}
        skipConfirmModal={skipConfirmModal}
        title={titleToRender}
      />
    </>
  )
}
