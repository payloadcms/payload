'use client'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { HiddenField } from '../../fields/Hidden/index.js'
import { TextField } from '../../fields/Text/index.js'
import { Form } from '../../forms/Form/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { EditDepthProvider, useEditDepth } from '../../providers/EditDepth/index.js'
import { FolderProvider, useFolder } from '../../providers/Folders/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { strings } from '../../strings.js'
import { Breadcrumbs } from '../Breadcrumbs/index.js'
import { Button } from '../Button/index.js'
import { Drawer } from '../Drawer/index.js'
import { DrawerActionHeader } from '../DrawerActionHeader/index.js'
import { DrawerContentContainer } from '../DrawerContentContainer/index.js'
import { FolderList } from '../FolderList/index.js'
import './index.scss'

const newFolderSlug = 'new-folder'

const baseClass = 'folderDrawer'

type FolderDrawerArgs = {
  readonly disabledFolderIDs?: (number | string)[]
  readonly drawerSlug: string
  readonly listTitle?: string
  readonly onSave: (selectedFolderID: number | string) => void
  readonly title: string
}

function FolderDrawerWithContext({
  disabledFolderIDs,
  drawerSlug,
  listTitle,
  onSave,
  title,
}: FolderDrawerArgs) {
  const { closeModal, openModal } = useModal()
  const { folderID: parentFolderID, setFolderID, subfolders } = useFolder()

  const handleOnSave = React.useCallback(() => {
    onSave(parentFolderID)
    closeModal(drawerSlug)
  }, [closeModal, parentFolderID, onSave, drawerSlug])

  const handleOnCancel = React.useCallback(() => {
    closeModal(drawerSlug)
  }, [closeModal, drawerSlug])

  return (
    <>
      <DrawerActionHeader onCancel={handleOnCancel} onSave={handleOnSave} title={title} />
      <div className={`${baseClass}__subHeaderContainer`}>
        <div className={`${baseClass}__subHeaderContent`}>
          {/* <Breadcrumbs
            onClick={({ folderID }) => {
              void setFolderID({ folderID })
            }}
          /> */}
          <Button buttonStyle="secondary" onClick={() => openModal(newFolderSlug)}>
            {strings.newFolder}
          </Button>
        </div>

        <NewFolderDrawer />
      </div>

      <FolderList disabledFolderIDs={disabledFolderIDs} folders={subfolders} title={listTitle} />
    </>
  )
}

export function FolderDrawer(props: FolderDrawerArgs) {
  const {
    breadcrumbs,
    collectionSlug,
    docs,
    folderCollectionSlug,
    folderID,
    moveToFolderIDs,
    subfolders,
  } = useFolder()
  const currentDepth = useEditDepth()

  return (
    <EditDepthProvider depth={currentDepth + 1}>
      <Drawer gutter={false} Header={null} slug={props.drawerSlug}>
        <FolderProvider
          collectionSlug={collectionSlug}
          folderCollectionSlug={folderCollectionSlug}
          initialData={{
            breadcrumbs,
            docs,
            folderID,
            subfolders,
          }}
        >
          <FolderDrawerWithContext {...props} disabledFolderIDs={moveToFolderIDs} />
        </FolderProvider>
      </Drawer>
    </EditDepthProvider>
  )
}

function NewFolderDrawer() {
  const { config } = useConfig()
  const { routes, serverURL } = config
  const { closeModal } = useModal()
  const { t } = useTranslation()
  const { folderCollectionSlug, folderID: parentFolderID, populateFolderData } = useFolder()

  const onSuccess = async (res, successToast, errorToast) => {
    const { doc } = await res.json()
    void populateFolderData({ folderID: doc.id })
    closeModal(newFolderSlug)
  }

  return (
    <Drawer gutter={false} Header={null} slug={newFolderSlug}>
      <Form
        action={`${serverURL}${routes.api}/${folderCollectionSlug}`}
        handleResponse={(res, successToast, errorToast) =>
          void onSuccess(res, successToast, errorToast)
        }
        initialState={{
          name: {
            initialValue: '',
            valid: true,
            validate: (value) => {
              if (!value) {
                return t('validation:required')
              }
              return true
            },
            value: '',
          },
          parentFolder: {
            initialValue: '',
            valid: true,
            value: '',
          },
        }}
        method="POST"
      >
        <DrawerActionHeader
          onCancel={() => {
            closeModal(newFolderSlug)
          }}
          title={strings.newFolder}
        />

        <DrawerContentContainer>
          <TextField
            field={{
              name: 'name',
              _path: 'name',
              label: strings.folderName,
              required: true,
            }}
            validate={(value) => {
              if (!value) {
                return t('validation:required')
              }
              return true
            }}
          />
          <HiddenField
            field={{
              name: 'parentFolder',
              _path: 'parentFolder',
            }}
            key={parentFolderID}
            value={parentFolderID || ''}
          />
        </DrawerContentContainer>
      </Form>
    </Drawer>
  )
}
