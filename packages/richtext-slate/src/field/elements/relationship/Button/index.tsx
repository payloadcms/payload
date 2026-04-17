'use client'
import type { ListDrawerProps } from '@payloadcms/ui'

import { useListDrawer, useTranslation } from '@payloadcms/ui'
import React, { Fragment, useCallback, useState } from 'react'
import { ReactEditor, useSlate } from 'slate-react'

import { RelationshipIcon } from '../../../icons/Relationship/index.js'
import { ElementButton } from '../../Button.js'
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition.js'
import { injectVoidElement } from '../../injectVoid.js'
import './index.scss'

const baseClass = 'relationship-rich-text-button'

const insertRelationship = (editor, { relationTo, value }) => {
  const text = { text: ' ' }

  const relationship = {
    type: 'relationship',
    children: [text],
    relationTo,
    value,
  }

  injectVoidElement(editor, relationship)

  ReactEditor.focus(editor)
}

type Props = {
  enabledCollectionSlugs: string[]
  path: string
}
const RelationshipButtonComponent: React.FC<Props> = ({ enabledCollectionSlugs }) => {
  const { t } = useTranslation()
  const editor = useSlate()
  const [selectedCollectionSlug] = useState(() => enabledCollectionSlugs[0])
  const [ListDrawer, ListDrawerToggler, { closeDrawer }] = useListDrawer({
    collectionSlugs: enabledCollectionSlugs,
    selectedCollection: selectedCollectionSlug,
  })

  const onSelect = useCallback<NonNullable<ListDrawerProps['onSelect']>>(
    ({ collectionSlug, docID }) => {
      insertRelationship(editor, {
        relationTo: collectionSlug,
        value: {
          id: docID,
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
          format="relationship"
          onClick={() => {
            // do nothing
          }}
          tooltip={t('fields:addRelationship')}
        >
          <RelationshipIcon />
        </ElementButton>
      </ListDrawerToggler>
      <ListDrawer onSelect={onSelect} />
    </Fragment>
  )
}

export const RelationshipButton = (props: Props): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition {...props}>
      <RelationshipButtonComponent {...props} />
    </EnabledRelationshipsCondition>
  )
}
