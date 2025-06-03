import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'
import { toast } from 'sonner'

import { Dots } from '../../../icons/Dots/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { ConfirmationModal } from '../../ConfirmationModal/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
import { Translation } from '../../Translation/index.js'
import { MoveItemsToFolderDrawer } from '../Drawers/MoveToFolder/index.js'
import { RenameFolderDrawer } from '../Drawers/RenameFolder/index.js'

const renameFolderDrawerSlug = 'rename-folder--current-folder'
const moveToFolderDrawerSlug = 'move-to-folder--current-folder'
const confirmDeleteDrawerSlug = 'confirm-many-delete'

const baseClass = 'current-folder-actions'

type Props = {
  className?: string
}
export function CurrentFolderActions({ className }: Props) {
  const {
    breadcrumbs,
    currentFolder,
    folderCollectionConfig,
    folderCollectionSlug,
    folderID,
    moveToFolder,
    renameFolder,
    setFolderID,
  } = useFolder()
  const { config } = useConfig()
  const { routes, serverURL } = config
  const { closeModal, openModal } = useModal()
  const { i18n, t } = useTranslation()

  const deleteCurrentFolder = React.useCallback(async () => {
    await fetch(`${serverURL}${routes.api}/${folderCollectionSlug}/${folderID}?depth=0`, {
      credentials: 'include',
      method: 'DELETE',
    })
    await setFolderID({ folderID: breadcrumbs[breadcrumbs.length - 2]?.id || null })
  }, [breadcrumbs, folderCollectionSlug, folderID, routes.api, serverURL, setFolderID])

  if (!folderID) {
    return null
  }

  return (
    <>
      <Popup
        button={<Dots />}
        className={[baseClass, className].filter(Boolean).join(' ')}
        render={() => (
          <PopupList.ButtonGroup>
            <PopupList.Button
              onClick={() => {
                openModal(renameFolderDrawerSlug)
              }}
            >
              {t('folder:renameFolder')}
            </PopupList.Button>
            <PopupList.Button
              onClick={() => {
                openModal(moveToFolderDrawerSlug)
              }}
            >
              {t('folder:moveFolder')}
            </PopupList.Button>
            <PopupList.Button
              onClick={() => {
                openModal(confirmDeleteDrawerSlug)
              }}
            >
              {t('folder:deleteFolder')}
            </PopupList.Button>
          </PopupList.ButtonGroup>
        )}
      />
      <MoveItemsToFolderDrawer
        action="moveItemToFolder"
        drawerSlug={moveToFolderDrawerSlug}
        fromFolderID={currentFolder?.value.id}
        fromFolderName={currentFolder?.value._folderOrDocumentTitle}
        itemsToMove={[currentFolder]}
        onConfirm={async ({ id, name }) => {
          await moveToFolder({
            itemsToMove: [currentFolder],
            toFolderID: id,
          })
          if (id) {
            // moved to folder
            toast.success(
              t('folder:itemHasBeenMoved', {
                folderName: `"${name}"`,
                title: currentFolder.value._folderOrDocumentTitle,
              }),
            )
          } else {
            // moved to root
            toast.success(
              t('folder:itemHasBeenMovedToRoot', {
                title: currentFolder.value._folderOrDocumentTitle,
              }),
            )
          }
          closeModal(moveToFolderDrawerSlug)
        }}
        title={currentFolder.value._folderOrDocumentTitle}
      />

      <ConfirmationModal
        body={
          <Translation
            elements={{
              '1': ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="general:aboutToDelete"
            t={t}
            variables={{
              label: getTranslation(folderCollectionConfig.labels.singular, i18n),
              title: currentFolder.value._folderOrDocumentTitle,
            }}
          />
        }
        confirmingLabel={t('general:deleting')}
        heading={t('general:confirmDeletion')}
        modalSlug={confirmDeleteDrawerSlug}
        onConfirm={deleteCurrentFolder}
      />

      <RenameFolderDrawer
        drawerSlug={renameFolderDrawerSlug}
        folderToRename={currentFolder}
        onRenameConfirm={({ folderID: updatedFolderID, updatedName }) => {
          renameFolder({
            folderID: updatedFolderID,
            newName: updatedName,
          })
          closeModal(renameFolderDrawerSlug)
        }}
      />
    </>
  )
}
