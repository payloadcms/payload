'use client'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'
import { toast } from 'sonner'

import type { Props as ButtonProps } from '../../Button/types.js'

import { useForm, useFormFields } from '../../../forms/Form/context.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useMoveToFolderDrawer } from '../../../providers/MoveToFolderProvider/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import './index.scss'

const baseClass = 'move-doc-to-folder'
const moveDocToFolderDrawerSlug = 'move-doc-to-folder'

export function MoveDocToFolder({ className = '' }) {
  const dispatchField = useFormFields(([_, dispatch]) => dispatch)
  const currentParentFolder = useFormFields(([fields]) => (fields && fields?._folder) || null)
  const { id, collectionSlug, initialData, title } = useDocumentInfo()
  const { setModified } = useForm()

  return (
    <MoveDocToFolderButton
      className={className}
      collectionSlug={collectionSlug}
      docData={initialData}
      docID={id}
      docTitle={title}
      fromFolderID={currentParentFolder?.value as number | string}
      onConfirm={({ id }) => {
        if (currentParentFolder !== id) {
          dispatchField({
            type: 'UPDATE',
            path: '_folder',
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
  buttonProps?: Partial<ButtonProps>
  className?: string
  collectionSlug: string
  docData: any
  docID: number | string
  docTitle?: string
  fromFolderID?: number | string
  onConfirm?: (args: { id: number | string; name: string }) => Promise<void> | void
  skipConfirmModal?: boolean
}

export const MoveDocToFolderButton = ({
  buttonProps,
  className = '',
  collectionSlug,
  docData,
  docID,
  docTitle,
  fromFolderID,
  onConfirm,
  skipConfirmModal,
}: MoveDocToFolderButtonProps) => {
  const { dispatch } = useMoveToFolderDrawer()
  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const { closeModal, openModal } = useModal()

  const [fromFolderName, setFromFolderName] = React.useState(() => `${t('general:loading')}...`)
  const loadedFolderName = React.useRef(false)

  React.useEffect(() => {
    async function fetchFolderLabel() {
      if (fromFolderID && (typeof fromFolderID === 'string' || typeof fromFolderID === 'number')) {
        const response = await fetch(`${config.routes.api}/${config.folders.slug}/${fromFolderID}`)
        const folderData = await response.json()
        setFromFolderName(folderData?.name || t('folder:noFolder'))
        loadedFolderName.current = true
      } else {
        setFromFolderName(t('folder:noFolder'))
        loadedFolderName.current = true
      }
    }

    if (!loadedFolderName.current) {
      void fetchFolderLabel()
    }
  }, [config.folders.slug, config.routes.api, fromFolderID, t])

  return (
    <Button
      buttonStyle="subtle"
      className={[baseClass, className].filter(Boolean).join(' ')}
      icon={<FolderIcon />}
      iconPosition="left"
      onClick={() => {
        dispatch({
          type: 'INITIALIZE',
          payload: {
            action: 'moveItemToFolder',
            drawerSlug: moveDocToFolderDrawerSlug,
            fromFolderID,
            fromFolderName,
            itemsToMove: [
              {
                itemKey: `${collectionSlug}-${docID}`,
                relationTo: collectionSlug,
                value: { ...docData, id: docID },
              },
            ],
            onConfirm: async (args) => {
              if (fromFolderID !== args.id && typeof onConfirm === 'function') {
                try {
                  await onConfirm(args)

                  if (args.id) {
                    // moved to folder
                    toast.success(
                      t('folder:itemHasBeenMoved', {
                        folderName: `"${args.name}"`,
                        title: docTitle,
                      }),
                    )
                  } else {
                    // moved to root
                    toast.success(
                      t('folder:itemHasBeenMovedToRoot', {
                        title: docTitle,
                      }),
                    )
                  }
                } catch (_) {
                  // todo: add error toast?
                }
              }

              closeModal(moveDocToFolderDrawerSlug)
            },
            skipConfirmModal,
            title:
              docTitle || getTranslation(getEntityConfig({ collectionSlug }).labels.singular, i18n),
          },
        })
        openModal(moveDocToFolderDrawerSlug)
      }}
      {...buttonProps}
    >
      {fromFolderName}
    </Button>
  )
}
