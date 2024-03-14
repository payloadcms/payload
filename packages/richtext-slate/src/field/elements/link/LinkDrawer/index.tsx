'use client'

import {
  Drawer,
  Form,
  type FormProps,
  FormSubmit,
  RenderFields,
  getFormState,
  useConfig,
  useDocumentInfo,
  useEditDepth,
  useFieldPath,
  useTranslation,
} from '@payloadcms/ui'
import { FieldPathProvider } from '@payloadcms/ui/forms'
import { useHotkey } from '@payloadcms/ui/hooks'
import React, { useCallback, useRef } from 'react'

import type { Props } from './types.js'

import { linkFieldsSchemaPath } from '../shared.js'
import './index.scss'

const baseClass = 'rich-text-link-edit-modal'

export const LinkDrawer: React.FC<Props> = ({
  drawerSlug,
  fieldMap,
  handleModalSubmit,
  initialState,
}) => {
  const { t } = useTranslation()
  const { schemaPath } = useFieldPath()
  const fieldMapPath = `${schemaPath}.${linkFieldsSchemaPath}`
  const { id } = useDocumentInfo()
  const config = useConfig()

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      return await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          formState: prevFormState,
          operation: 'update',
          schemaPath: fieldMapPath,
        },
        serverURL: config.serverURL,
      })
    },

    [config.routes.api, config.serverURL, fieldMapPath, id],
  )

  return (
    <Drawer className={baseClass} slug={drawerSlug} title={t('fields:editLink')}>
      <Form initialState={initialState} onChange={[onChange]} onSubmit={handleModalSubmit}>
        <RenderFields fieldMap={fieldMap} forceRender path="" readOnly={false} schemaPath="" />
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
