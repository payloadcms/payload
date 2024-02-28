import {
  Drawer,
  FieldPathProvider,
  Form,
  type FormState,
  FormSubmit,
  RenderFields,
  getFormState,
  useConfig,
  useDocumentInfo,
  useTranslation,
} from '@payloadcms/ui'
import { useFieldPath } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { useEditorConfigContext } from '../../../lexical/config/client/EditorConfigProvider'
import './index.scss'
import { type Props } from './types'

const baseClass = 'lexical-link-edit-drawer'

export const LinkDrawer: React.FC<Props> = ({ drawerSlug, handleModalSubmit, stateData }) => {
  const { t } = useTranslation()
  const { id, getDocPreferences } = useDocumentInfo()
  const { schemaPath } = useFieldPath()
  const config = useConfig()
  const [initialState, setInitialState] = useState<FormState>({})
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

  return (
    <Drawer className={baseClass} slug={drawerSlug} title={t('fields:editLink') ?? ''}>
      <FieldPathProvider path="" schemaPath="">
        <Form fields={fieldMap} initialState={initialState} onSubmit={handleModalSubmit}>
          <RenderFields fieldMap={fieldMap} forceRender readOnly={false} />

          <FormSubmit>{t('general:submit')}</FormSubmit>
        </Form>
      </FieldPathProvider>
    </Drawer>
  )
}
