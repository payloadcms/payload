'use client'
import type { FolderOrDocument } from 'payload/shared'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { TextField } from '../../../../fields/Text/index.js'
import { Form } from '../../../../forms/Form/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useFolder } from '../../../../providers/Folders/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Drawer } from '../../../Drawer/index.js'
import { DrawerContentContainer } from '../../../DrawerContentContainer/index.js'
import { DrawerHeader } from '../DrawerHeader/index.js'

type Props = {
  readonly drawerSlug: string
  readonly folderToRename: FolderOrDocument
  readonly onRenameConfirm: ({
    folderID,
    updatedName,
  }: {
    folderID: number | string
    updatedName: string
  }) => void
}
export function RenameFolderDrawer(props: Props) {
  const { drawerSlug, folderToRename, onRenameConfirm } = props
  const { t } = useTranslation()
  const { folderCollectionConfig, folderCollectionSlug } = useFolder()
  const { config } = useConfig()
  const { closeModal } = useModal()
  const { routes, serverURL } = config

  const folderName = folderToRename.value._folderOrDocumentTitle
  const folderID = folderToRename.value.id
  const folderUseAsTitle = folderCollectionConfig.admin.useAsTitle

  return (
    <Drawer gutter={false} Header={null} slug={drawerSlug}>
      <Form
        action={`${serverURL}${routes.api}/${folderCollectionSlug}/${folderToRename.value.id}`}
        initialState={{
          name: {
            initialValue: folderName,
            valid: true,
            validate: (value) => {
              if (!value) {
                return t('validation:required')
              }
              return true
            },
            value: folderName,
          },
        }}
        method="PATCH"
        onSuccess={(data: { doc: FolderOrDocument['value'] }) => {
          return onRenameConfirm({
            folderID,
            updatedName: data?.doc?.[folderUseAsTitle],
          })
        }}
      >
        <DrawerHeader onCancel={() => closeModal(drawerSlug)} title={t('folder:renameFolder')} />

        <DrawerContentContainer>
          <TextField
            field={{
              name: 'name',
              label: t('folder:folderName'),
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
  )
}
