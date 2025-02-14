'use client'
import type { FolderInterface } from 'payload/shared'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { TextField } from '../../../../fields/Text/index.js'
import { Form } from '../../../../forms/Form/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useFolder } from '../../../../providers/Folders/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Drawer } from '../../../Drawer/index.js'
import { DrawerContentContainer } from '../../../DrawerContentContainer/index.js'
import { strings } from '../../strings.js'
import { DrawerHeader } from '../DrawerHeader/index.js'

type Props = {
  readonly drawerSlug: string
  readonly folderToRename: FolderInterface
  readonly onRenameConfirm: ({
    name,
    folderID,
  }: {
    folderID: number | string
    name: string
  }) => void
}
export function RenameFolderDrawer(props: Props) {
  const { drawerSlug, folderToRename, onRenameConfirm } = props
  const { t } = useTranslation()
  const { folderCollectionSlug } = useFolder()
  const { config } = useConfig()
  const { closeModal } = useModal()
  const { routes, serverURL } = config

  const folderName = folderToRename?.name
  const folderID = folderToRename?.id

  return (
    <Drawer gutter={false} Header={null} slug={drawerSlug}>
      <Form
        action={`${serverURL}${routes.api}/${folderCollectionSlug}/${folderID}`}
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
        onSuccess={(data: { doc: FolderInterface }) => {
          return onRenameConfirm({
            name: data?.doc?.name,
            folderID,
          })
        }}
      >
        <DrawerHeader onCancel={() => closeModal(drawerSlug)} title={strings.renameFolder} />

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
  )
}
