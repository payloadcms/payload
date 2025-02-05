'use client'
import type { ClientCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import {
  Collapsible,
  Drawer,
  Form,
  FormSubmit,
  RenderFields,
  useConfig,
  XIcon,
} from '@payloadcms/ui'
import React from 'react'

import './index.scss'
import { initialState } from './exportFields.js'

const baseClass = 'export-drawer'

export const ExportDrawer: React.FC<{
  collectionSlug: string
  drawerSlug: string
  exportCollectionSlug: string
}> = ({ collectionSlug, drawerSlug, exportCollectionSlug }) => {
  const { toggleModal } = useModal()
  const {
    config: { collections },
  } = useConfig()

  const collectionConfig =
    (collections.find(
      (collection) => collection.slug === collectionSlug,
    ) as ClientCollectionConfig) || {}

  const collectionLabel = collectionConfig.labels
    ? collectionConfig.labels.singular
    : collectionSlug || 'Collection'

  const onSuccess = React.useCallback(() => {
    console.log('Exported')
    toggleModal(drawerSlug)
  }, [toggleModal, drawerSlug])

  const exportCollection =
    collections.find((collection) => collection.slug === exportCollectionSlug) || {}

  const exportFields = exportCollection.fields || []

  return (
    <Drawer
      className={baseClass}
      gutter={false}
      Header={
        <div className={`${baseClass}__header`}>
          <h2>{`Export ${collectionLabel}`}</h2>
          <button
            className={`${baseClass}__close`}
            onClick={() => toggleModal(drawerSlug)}
            type="button"
          >
            <XIcon className={`${baseClass}__icon`} />
          </button>
        </div>
      }
      slug={drawerSlug}
    >
      <div className={`${baseClass}__subheader`}>
        <div>Creating export{collectionLabel ? ` from ${collectionLabel}` : ''}</div>
        <FormSubmit>Export</FormSubmit>
      </div>
      <div className={`${baseClass}__options`}>
        <Collapsible header="Export options">
          <Form action={'/admin'} initialState={initialState} method="POST" onSuccess={onSuccess}>
            <RenderFields
              fields={exportFields}
              parentIndexPath=""
              parentPath=""
              parentSchemaPath=""
              permissions={true}
            />
          </Form>
        </Collapsible>
      </div>
      <div className={`${baseClass}__preview`}>
        <div className={`${baseClass}__preview-title`}>
          <h3>Preview</h3>
          <span>(result count) total documents</span>
        </div>
        (data preview here)
      </div>
    </Drawer>
  )
}
