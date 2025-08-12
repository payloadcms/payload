'use client'

import type { ListDrawerProps } from '@payloadcms/ui'

import { useListDrawer, useTranslation } from '@payloadcms/ui'
import React, { Fragment, useCallback } from 'react'
import { ReactEditor, useSlate } from 'slate-react'

import { UploadIcon } from '../../../icons/Upload/index.js'
import { ElementButton } from '../../Button.js'
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition.js'
import { injectVoidElement } from '../../injectVoid.js'
import './index.scss'

const baseClass = 'upload-rich-text-button'

const insertUpload = (editor, { relationTo, value }) => {
  const text = { text: ' ' }

  const upload = {
    type: 'upload',
    children: [text],
    relationTo,
    value,
  }

  injectVoidElement(editor, upload)

  ReactEditor.focus(editor)
}

type ButtonProps = {
  enabledCollectionSlugs: string[]
  path: string
}

const UploadButton: React.FC<ButtonProps> = ({ enabledCollectionSlugs }) => {
  const { t } = useTranslation()
  const editor = useSlate()

  const [ListDrawer, ListDrawerToggler, { closeDrawer }] = useListDrawer({
    collectionSlugs: enabledCollectionSlugs,
    uploads: true,
  })

  const onSelect = useCallback<NonNullable<ListDrawerProps['onSelect']>>(
    ({ collectionSlug, doc }) => {
      insertUpload(editor, {
        relationTo: collectionSlug,
        value: {
          id: doc.id,
        },
      })
      closeDrawer()
    },
    [editor, closeDrawer],
  )

  return (
    <Fragment>
      <ListDrawerToggler>
        <ElementButton
          className={baseClass}
          el="div"
          format="upload"
          onClick={() => {
            // do nothing
          }}
          tooltip={t('fields:addUpload')}
        >
          <UploadIcon />
        </ElementButton>
      </ListDrawerToggler>
      <ListDrawer onSelect={onSelect} />
    </Fragment>
  )
}

export const UploadElementButton = (props: ButtonProps): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition {...props} uploads>
      <UploadButton {...props} />
    </EnabledRelationshipsCondition>
  )
}
