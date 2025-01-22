'use client'

import type { FormProps } from '@payloadcms/ui'

import {
  Drawer,
  EditDepthProvider,
  Form,
  FormSubmit,
  RenderFields,
  useDocumentInfo,
  useEditDepth,
  useHotkey,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useRef } from 'react'

import type { Props } from './types.js'

import { linkFieldsSchemaPath } from '../shared.js'
import './index.scss'

const baseClass = 'rich-text-link-edit-modal'

export const LinkDrawer: React.FC<Props> = ({
  drawerSlug,
  fields,
  handleModalSubmit,
  initialState,
  schemaPath,
}) => {
  const { t } = useTranslation()
  const fieldMapPath = `${schemaPath}.${linkFieldsSchemaPath}`

  const { id, collectionSlug, getDocPreferences, globalSlug } = useDocumentInfo()

  const { getFormState } = useServerFunctions()

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const { state } = await getFormState({
        id,
        collectionSlug,
        docPermissions: {
          fields: true,
        },
        docPreferences: await getDocPreferences(),
        formState: prevFormState,
        globalSlug,
        operation: 'update',
        schemaPath: fieldMapPath ?? '',
      })

      return state
    },

    [getFormState, id, collectionSlug, getDocPreferences, globalSlug, fieldMapPath],
  )

  return (
    <EditDepthProvider>
      <Drawer className={baseClass} slug={drawerSlug} title={t('fields:editLink')}>
        <Form
          beforeSubmit={[onChange]}
          disableValidationOnSubmit
          initialState={initialState}
          onChange={[onChange]}
          onSubmit={handleModalSubmit}
        >
          <RenderFields
            fields={fields}
            forceRender
            parentIndexPath=""
            parentPath={''}
            parentSchemaPath=""
            permissions={true}
            readOnly={false}
          />
          <LinkSubmit />
        </Form>
      </Drawer>
    </EditDepthProvider>
  )
}

const LinkSubmit: React.FC = () => {
  const { t } = useTranslation()
  const ref = useRef<HTMLButtonElement>(null)
  const editDepth = useEditDepth()

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (ref?.current) {
      ref.current.click()
    }
  })

  return <FormSubmit ref={ref}>{t('general:submit')}</FormSubmit>
}
