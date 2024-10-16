'use client'

import type { FormProps } from '@payloadcms/ui'

import {
  Drawer,
  Form,
  FormSubmit,
  RenderFields,
  useConfig,
  useDocumentInfo,
  useEditDepth,
  useFieldProps,
  useHotkey,
  useTranslation,
} from '@payloadcms/ui'
import { getFormState } from '@payloadcms/ui/shared'
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
}) => {
  const { t } = useTranslation()
  const { schemaPath } = useFieldProps()
  const fieldMapPath = `${schemaPath}.${linkFieldsSchemaPath}`
  const { id } = useDocumentInfo()
  const { config } = useConfig()

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const { state } = await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          formState: prevFormState,
          operation: 'update',
          schemaPath: fieldMapPath,
        },
        serverURL: config.serverURL,
      })

      return state
    },

    [config.routes.api, config.serverURL, fieldMapPath, id],
  )

  return (
    <Drawer className={baseClass} slug={drawerSlug} title={t('fields:editLink')}>
      <Form
        beforeSubmit={[onChange]}
        disableValidationOnSubmit
        initialState={initialState}
        onChange={[onChange]}
        onSubmit={handleModalSubmit}
      >
        <RenderFields fields={fields} forceRender path="" readOnly={false} schemaPath="" />
        <LinkSubmit />
      </Form>
    </Drawer>
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
