'use client'
import type { ClientCollectionConfig, ClientField } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { Collapsible, Drawer, Form, FormSubmit, RenderFields, useConfig } from '@payloadcms/ui'
import { fieldAffectsData } from 'payload/shared'
import React from 'react'

import { initialState } from './exportFields.js'
import './index.scss'

const baseClass = 'export-drawer'

export const ExportDrawer: React.FC<{
  collectionConfig: ClientCollectionConfig
  collectionLabel: string | undefined
  drawerSlug: string
}> = ({ collectionConfig, collectionLabel, drawerSlug }) => {
  const { toggleModal } = useModal()
  const {
    config: { localization },
  } = useConfig()
  const localizationEnabled = localization && localization.locales.length > 1
  const localeOptions = localizationEnabled
    ? localization.locales.map((locale) => ({
        label: typeof locale === 'string' ? locale : locale.label,
        value: typeof locale === 'string' ? locale : locale.code,
      }))
    : []

  const sortByFields = collectionConfig.fields.filter((field) => fieldAffectsData(field))
  const sortByOptions = sortByFields.map((field) => ({
    label: field.label || field.name,
    value: field.name,
  }))

  const exportFields: ClientField[] = [
    {
      name: 'filename',
      type: 'text',
      label: 'Filename',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'format',
          type: 'select',
          admin: {
            isClearable: false,
            isSortable: false,
            width: '33.3%',
          },
          label: 'Export Format',
          options: [
            {
              label: 'CSV',
              value: 'csv',
            },
          ],
        },
        {
          name: 'limit',
          type: 'number',
          admin: {
            autoComplete: '',
            placeholder: '',
            step: 1,
            width: '33.3%',
          },
          label: 'Limit',
        },
        {
          name: 'sortby',
          type: 'select',
          admin: {
            isClearable: false,
            isSortable: false,
            width: '33.3%',
          },
          label: 'Sort By',
          options: sortByOptions,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'locales',
          type: 'select',
          admin: {
            hidden: !localizationEnabled,
            isClearable: false,
            isSortable: false,
            width: '33.3%',
          },
          hasMany: true,
          label: 'Locales',
          options: [
            {
              label: 'All',
              value: 'all',
            },
            ...localeOptions,
          ],
        },
        {
          name: 'drafts',
          type: 'select',
          admin: {
            isClearable: false,
            isSortable: false,
            width: `${localizationEnabled ? '33.3%' : '50%'}`,
          },
          label: 'Drafts',
          options: [
            {
              label: 'Include',
              value: 'include',
            },
            {
              label: 'Exclude',
              value: 'exclude',
            },
          ],
        },

        {
          name: 'depth',
          type: 'number',
          admin: {
            autoComplete: '',
            placeholder: '',
            step: 1,
            width: `${localizationEnabled ? '33.3%' : '50%'}`,
          },
          label: 'Depth',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'useCurrentFilters',
          type: 'checkbox',
          admin: {
            width: 'min-content',
          },
          label: 'Use current selection',
        },
        {
          name: 'useCurrentSelection',
          type: 'checkbox',
          admin: {
            width: 'min-content',
          },
          label: 'Use selected documents',
        },
      ],
    },
  ]

  const onSuccess = React.useCallback(() => {
    console.log('Exported')
    toggleModal(drawerSlug)
  }, [toggleModal, drawerSlug])

  return (
    <Drawer
      className={baseClass}
      gutter={false}
      Header={
        <div>
          <h2>{`Export ${collectionLabel}`}</h2>
          <button onClick={toggleModal(drawerSlug)} type="button">
            'X'
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
