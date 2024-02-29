import {
  Drawer,
  FieldPathProvider,
  Form,
  type FormProps,
  type FormState,
  FormSubmit,
  RenderFields,
  getFormState,
  useConfig,
  useDocumentInfo,
  useTranslation,
} from '@payloadcms/ui'
import { useFieldPath } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import { useEditorConfigContext } from '../../../lexical/config/client/EditorConfigProvider'
import './index.scss'
import { type Props } from './types'

const baseClass = 'lexical-link-edit-drawer'

export const LinkDrawer: React.FC<Props> = ({ drawerSlug, handleModalSubmit, stateData }) => {
  const { t } = useTranslation()
  const { id, getDocPreferences } = useDocumentInfo()
  const { schemaPath } = useFieldPath()
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
      const docPreferences = await getDocPreferences()

      const state = await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          data: stateData,
          docPreferences,
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
  }, [config.routes.api, config.serverURL, schemaFieldsPath, getDocPreferences, id, stateData])

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const docPreferences = await getDocPreferences()

      return getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          docPreferences,
          formState: prevFormState,
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL: config.serverURL,
      })
    },

    [config.routes.api, config.serverURL, schemaFieldsPath, getDocPreferences, id],
  )

  return (
    initialState !== false && (
      <Drawer className={baseClass} slug={drawerSlug} title={t('fields:editLink') ?? ''}>
        <FieldPathProvider path="" schemaPath="">
          <Form
            fields={Array.isArray(fieldMap) ? fieldMap : []}
            initialState={initialState}
            onChange={[onChange]}
            onSubmit={handleModalSubmit}
          >
            <RenderFields
              fieldMap={Array.isArray(fieldMap) ? fieldMap : []}
              forceRender
              readOnly={false}
            />

            <FormSubmit>{t('general:submit')}</FormSubmit>
          </Form>
        </FieldPathProvider>
      </Drawer>
    )
  )
}
