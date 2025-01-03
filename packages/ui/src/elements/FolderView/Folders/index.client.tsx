'use client'

import { useModal } from '@faceless-ui/modal'
import { useRouter, useSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React from 'react'

import { TextField } from '../../../fields/Text/index.js'
import { Form } from '../../../forms/Form/index.js'
import { GridViewIcon } from '../../../icons/GridView/index.js'
import { ListViewIcon } from '../../../icons/ListView/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { EditDepthProvider, useEditDepth } from '../../../providers/EditDepth/index.js'
import { useFolderListSettings } from '../../../providers/FolderListSettings/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { parseSearchParams } from '../../../utilities/parseSearchParams.js'
import { Button } from '../../Button/index.js'
import { Drawer } from '../../Drawer/index.js'
import { DrawerContentContainer } from '../../DrawerContentContainer/index.js'
import { FolderBreadcrumbs } from '../Breadcrumbs/index.js'
import { DrawerHeader } from '../DrawerHeader/index.js'
import { FolderCard } from '../FolderCard/index.js'
import { strings } from '../strings.js'
import './index.scss'

const editFolderSlug = 'edit-folder'

const baseClass = 'folders'

type Props = {
  readonly collectionSlug: string
}
export function Subfolders({ collectionSlug }: Props) {
  const { setViewType, viewType } = useFolderListSettings()
  const { docs, moveToDrawerSlug, setFolderID, setMoveToDocIDs, setMoveToFolderIDs, subfolders } =
    useFolder()
  const { openModal } = useModal()
  const router = useRouter()
  const searchParams = useSearchParams()
  const depth = useEditDepth()

  const [activeSubfolderName, setActiveSubfolderName] = React.useState<null | string>(null)
  const [activeSubfolderID, setActiveSubfolderID] = React.useState<null | number | string>(null)

  return (
    <div>
      <div className={`${baseClass}__breadcrumbSection`}>
        <FolderBreadcrumbs
          onClick={({ folderID }) => {
            if (depth === 0) {
              router.push(
                qs.stringify(
                  {
                    ...parseSearchParams(searchParams),
                    folderID: folderID ? String(folderID) : undefined,
                  },
                  { addQueryPrefix: true },
                ),
              )
            } else {
              void setFolderID({ folderID })
            }
          }}
        />
        <div className={`${baseClass}__icons`}>
          <Button
            buttonStyle={viewType === 'list' ? 'primary' : 'secondary'}
            onClick={() => setViewType('list')}
            size="small"
          >
            <ListViewIcon />
          </Button>
          <Button
            buttonStyle={viewType === 'grid' ? 'primary' : 'secondary'}
            onClick={() => setViewType('grid')}
            size="small"
          >
            <GridViewIcon />
          </Button>
        </div>
      </div>

      {viewType === 'grid' && (
        <div className={`${baseClass}__gridView`}>
          {subfolders && subfolders.length > 0 && (
            <div className={`${baseClass}__grid`}>
              {subfolders?.map((subfolder) => {
                return (
                  <FolderCard
                    className={`${baseClass}__gridCard`}
                    id={subfolder.id}
                    itemCount={subfolder.subfolderCount + subfolder.fileCount}
                    key={subfolder.id}
                    name={subfolder.name}
                    onMoveTrigger={() => {
                      setMoveToFolderIDs([subfolder.id])
                      openModal(moveToDrawerSlug)
                    }}
                    onRenameTrigger={() => {
                      setActiveSubfolderName(subfolder.name)
                      setActiveSubfolderID(subfolder.id)
                      openModal(editFolderSlug)
                    }}
                  />
                )
              })}

              <EditFolderNameDrawer
                activeSubfolderName={activeSubfolderName}
                selectedFolderID={activeSubfolderID}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditFolderNameDrawer({ activeSubfolderName, selectedFolderID }) {
  const { t } = useTranslation()
  const { config } = useConfig()
  const { routes, serverURL } = config
  const { closeModal } = useModal()

  const onSuccess = (res, successToast, errorToast) => {
    closeModal(editFolderSlug)
  }

  return (
    <EditDepthProvider>
      <Drawer gutter={false} Header={null} slug={editFolderSlug}>
        <Form
          action={`${serverURL}${routes.api}/${selectedFolderID}`}
          handleResponse={onSuccess}
          initialState={{
            name: {
              initialValue: activeSubfolderName,
              valid: true,
              validate: (value) => {
                if (!value) {
                  return t('validation:required')
                }
                return true
              },
              value: activeSubfolderName,
            },
          }}
          method="PATCH"
        >
          <DrawerHeader
            onCancel={() => {
              closeModal(editFolderSlug)
            }}
            title={strings.renameFolder}
          />

          <DrawerContentContainer>
            <TextField
              field={{
                name: 'name',
                label: strings.folderName,
                required: true,
              }}
              path="name"
              validate={(value) => {
                if (!value) {
                  return t('validation:required')
                }
                return true
              }}
            />
          </DrawerContentContainer>
        </Form>
      </Drawer>
    </EditDepthProvider>
  )
}
