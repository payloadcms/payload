'use client'
import type { FormProps } from '@payloadcms/ui'
import type { ClientField, CollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import {
  Collapsible,
  Drawer,
  Form,
  FormSubmit,
  RenderFields,
  useConfig,
  useSelection,
  useServerFunctions,
  XIcon,
} from '@payloadcms/ui'

import './index.scss'

import React from 'react'

import { modifyFields } from '../../export/modifyFields.js'
import { fields } from '../../exportFields.js'
import { useInitialState } from './exportFields.js'

const baseClass = 'export-drawer'

export const ExportDrawer: React.FC<{
  collectionSlug: string
  drawerSlug: string
  exportCollectionSlug: string
}> = ({ collectionSlug, drawerSlug, exportCollectionSlug }) => {
  const { toggleModal } = useModal()
  const { getFormState } = useServerFunctions()
  const [selectionToUse, setSelectionToUse] = React.useState('')
  const {
    config: { collections, localization },
  } = useConfig()

  const collectionConfig =
    (collections.find((collection) => collection.slug === collectionSlug) as CollectionConfig) || {}

  const collectionLabel = collectionConfig.labels
    ? collectionConfig.labels.singular
    : collectionSlug || 'Collection'

  const onSuccess = React.useCallback(() => {
    console.log('Exported')
    toggleModal(drawerSlug)
  }, [toggleModal, drawerSlug])

  const exportFields = modifyFields(fields, collectionConfig) as ClientField[]
  const initialState = useInitialState({ collectionConfig, localization })

  const onChange: FormProps['onChange'][0] = React.useCallback((formData) => {
    const currentSelection = formData.formState.selectionToUse.value
    if (currentSelection !== selectionToUse) {
      setSelectionToUse(currentSelection)
    }
  }, [])

  const selectedDocs = []
  const selection = useSelection()
  selection.selected.forEach((value, key) => {
    if (value === true) {
      selectedDocs.push(key)
    }
  })

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
          <Form
            action={'/admin'}
            initialState={initialState}
            method="POST"
            onChange={[onChange]}
            onSuccess={onSuccess}
          >
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
        {/* if selectionToUse is current selection, return only the selected docs */}
        {/* if selectionToUse is all, return all docs and apply export settings */}
        {/* if selectionToUse is current filters, add filters to all docs and export settings */}
      </div>
    </Drawer>
  )
}
