'use client'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { isNumber } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { FolderIcon } from '../../../icons/Folder/index.js'
import { ThreeDotsIcon } from '../../../icons/ThreeDots/index.js'
import { useFolderAndDocumentSelections } from '../../../providers/FolderAndDocumentSelections/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { parseSearchParams } from '../../../utilities/parseSearchParams.js'
import { useDrawerDepth } from '../../Drawer/index.js'
import { useListDrawerContext } from '../../ListDrawer/Provider.js'
import { Popup, PopupList } from '../../Popup/index.js'
import './index.scss'
import { useTableColumns } from '../../TableColumns/index.js'
import { FolderFileCard } from '../FolderFileCard/index.js'
import { strings } from '../strings.js'

const baseClass = 'folderCard'

type Props = {
  readonly className?: string
  readonly id: number | string
  readonly itemCount: number
  readonly name: string
  readonly onMoveTrigger: () => void
  readonly onRenameTrigger: () => void
}
export function FolderCard({
  id,
  name,
  className = '',
  itemCount,
  onMoveTrigger,
  onRenameTrigger,
}: Props) {
  const { deleteFolders, setFolderID } = useFolder()
  const { t } = useTranslation()
  const { isSelecting, selectedFolders, toggleSelection } = useFolderAndDocumentSelections()
  const [isDeleting, setIsDeleting] = React.useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const drawerDepth = useDrawerDepth()
  const { rebuildTableState } = useTableColumns()
  const isSelected = selectedFolders.has(id)

  const deleteAction = React.useCallback(async () => {
    setIsDeleting(true)
    const deleteFolderRes = await deleteFolders([id])
    setIsDeleting(false)
  }, [deleteFolders, id])

  return (
    <FolderFileCard
      ButtonContent={
        <React.Fragment>
          <FolderIcon />
          <div className={`${baseClass}__details`}>
            <div className={`${baseClass}__title`}>
              <span>{name}</span>
            </div>
            <p
              className={`${baseClass}__itemCount`}
            >{`${itemCount} ${itemCount === 1 ? strings.item : strings.items}`}</p>
          </div>

          <ThreeDotsIcon className={`${baseClass}__dotsIconPlaceholder`} />
        </React.Fragment>
      }
      className={`${baseClass} ${className || ''}`}
      isDeleting={isDeleting}
      isSelected={isSelected}
      isSelecting={isSelecting}
      onClick={() => {
        if (isSelecting) {
          toggleSelection({ id, type: 'folder' })
        } else {
          // navigating to selected folder
          if (drawerDepth === 1) {
            // not in a drawer, use the router and the server will re-render the page
            void router.push(
              qs.stringify(
                {
                  ...parseSearchParams(searchParams),
                  folderID: id,
                },
                { addQueryPrefix: true },
              ),
            )
          } else {
            // in a drawer
            void rebuildTableState({
              query: {
                folderID: isNumber(id) ? String(id) : id,
              },
            })
            void setFolderID({ folderID: id })
          }
        }
      }}
    >
      <Popup
        button={<ThreeDotsIcon />}
        buttonType={isDeleting ? 'none' : 'default'}
        className={`${baseClass}__popup`}
        horizontalAlign="right"
        size="large"
        verticalAlign="bottom"
      >
        <PopupList.ButtonGroup>
          <React.Fragment>
            <PopupList.Button id="action-rename-folder" onClick={onRenameTrigger}>
              {strings.rename}
            </PopupList.Button>
            <PopupList.Button id="action-move-folder" onClick={onMoveTrigger}>
              {strings.move}
            </PopupList.Button>
            <PopupList.Button id="action-delete-folder" onClick={() => void deleteAction()}>
              {t('general:delete')}
            </PopupList.Button>
            <PopupList.Button
              id="action-select-folder"
              onClick={() => {
                toggleSelection({ id, type: 'folder' })
              }}
            >
              {strings.selectFolder}
            </PopupList.Button>
          </React.Fragment>
        </PopupList.ButtonGroup>
      </Popup>
    </FolderFileCard>
  )
}
