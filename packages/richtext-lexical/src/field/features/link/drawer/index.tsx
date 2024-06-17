import type { FormProps } from '@payloadcms/ui/forms/Form'
import type { FormState } from 'payload'

import {
  Drawer,
  Form,
  FormSubmit,
  RenderFields,
  useConfig,
  useDocumentInfo,
  useFieldProps,
  useTranslation,
} from '@payloadcms/ui/client'
import { getFormState } from '@payloadcms/ui/shared'
import React, { useCallback, useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { useEditorConfigContext } from '../../../lexical/config/client/EditorConfigProvider.js'
import './index.scss'
import { type Props } from './types.js'

const baseClass = 'lexical-link-edit-drawer'

export const LinkDrawer: React.FC<Props> = ({ drawerSlug, handleModalSubmit, stateData }) => {
  const { t } = useTranslation()
  const { id } = useDocumentInfo()
  const { schemaPath } = useFieldProps()
  const config = useConfig()
  const [initialState, setInitialState] = useState<FormState | false>(false)
  const {
    field: { richTextComponentMap },
  } = useEditorConfigContext()

  const componentMapRenderedFieldsPath = `feature.link.fields.fields`
  const schemaFieldsPath = `${schemaPath}.feature.link.fields`

  const fieldMap = richTextComponentMap.get(componentMapRenderedFieldsPath) // Field Schema

  useEffect(() => {
    const awaitInitialState = async () => {
      const state = await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          data: stateData,
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL: config.serverURL,
      }) // Form State

      setInitialState(state)
    }

    if (stateData) {
      void awaitInitialState()
    }
  }, [config.routes.api, config.serverURL, schemaFieldsPath, id, stateData])

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      return await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          formState: prevFormState,
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL: config.serverURL,
      })
    },

    [config.routes.api, config.serverURL, schemaFieldsPath, id],
  )

  return (
    <Drawer className={baseClass} slug={drawerSlug} title={t('fields:editLink') ?? ''}>
      {initialState !== false && (
        <Form
          beforeSubmit={[onChange]}
          disableValidationOnSubmit
          fields={Array.isArray(fieldMap) ? fieldMap : []}
          initialState={initialState}
          onChange={[onChange]}
          onSubmit={handleModalSubmit}
          uuid={uuid()}
        >
          <RenderFields
            fieldMap={Array.isArray(fieldMap) ? fieldMap : []}
            forceRender
            path="" // See Blocks feature path for details as for why this is empty
            readOnly={false}
            schemaPath={schemaFieldsPath}
          />

          <FormSubmit>{t('general:submit')}</FormSubmit>
        </Form>
      )}
    </Drawer>
  )
}
