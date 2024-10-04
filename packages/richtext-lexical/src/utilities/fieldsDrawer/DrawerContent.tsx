'use client'
import type { ClientField, FormState } from 'payload'

import {
  Form,
  FormSubmit,
  getFormStateFetch,
  RenderFields,
  useConfig,
  useDocumentInfo,
  useFieldProps,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

import type { FieldsDrawerProps } from './Drawer.js'

import { useEditorConfigContext } from '../../lexical/config/client/EditorConfigProvider.js'

export const DrawerContent: React.FC<Omit<FieldsDrawerProps, 'drawerSlug' | 'drawerTitle'>> = ({
  data,
  featureKey,
  fieldMapOverride,
  handleDrawerSubmit,
  schemaFieldsPathOverride,
  schemaPathSuffix,
}) => {
  const { t } = useTranslation()
  const { id } = useDocumentInfo()
  const { schemaPath } = useFieldProps()

  const [initialState, setInitialState] = useState<false | FormState | undefined>(false)

  const {
    field: { richTextComponentMap },
  } = useEditorConfigContext()

  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
  } = useConfig()

  const { getFormState } = useServerFunctions()

  const componentMapRenderedFieldsPath = `lexical_internal_feature.${featureKey}.fields${schemaPathSuffix ? `.${schemaPathSuffix}` : ''}`
  const schemaFieldsPath =
    schemaFieldsPathOverride ??
    `${schemaPath}.lexical_internal_feature.${featureKey}${schemaPathSuffix ? `.${schemaPathSuffix}` : ''}`

  const fields: any =
    fieldMapOverride ?? (richTextComponentMap?.get(componentMapRenderedFieldsPath) as ClientField[]) // Field Schema

  useEffect(() => {
    const awaitInitialState = async () => {
      const { state } = await getFormStateFetch({
        apiRoute: 'api',
        body: {
          id,
          data: data ?? {},
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL,
      })

      setInitialState(state)
    }

    void awaitInitialState()
  }, [schemaFieldsPath, id, data, apiRoute, serverURL])

  const onChange = useCallback(
    async ({ formState: prevFormState }) => {
      const { state } = await getFormStateFetch({
        apiRoute,
        body: {
          id,
          formState: prevFormState,
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL,
      })

      return state
    },
    [schemaFieldsPath, id, apiRoute, serverURL],
  )

  if (initialState === false) {
    return null
  }

  return (
    <Form
      beforeSubmit={[onChange]}
      disableValidationOnSubmit
      fields={Array.isArray(fields) ? fields : []}
      initialState={initialState}
      onChange={[onChange]}
      onSubmit={handleDrawerSubmit}
      uuid={uuid()}
    >
      <RenderFields
        fields={Array.isArray(fields) ? fields : []}
        forceRender
        path="" // See Blocks feature path for details as for why this is empty
        readOnly={false}
        schemaPath={schemaFieldsPath}
      />

      <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
    </Form>
  )
}
