'use client'
import type { ClientField, FormState } from 'payload'

import {
  Form,
  FormSubmit,
  useDocumentInfo,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import type { FieldsDrawerProps } from './Drawer.js'

import { useEditorConfigContext } from '../../lexical/config/client/EditorConfigProvider.js'

export const DrawerContent: React.FC<Omit<FieldsDrawerProps, 'drawerSlug' | 'drawerTitle'>> = ({
  data,
  featureKey,
  fieldMapOverride,
  handleDrawerSubmit,
  schemaFieldsPathOverride,
  schemaPath,
  schemaPathSuffix,
}) => {
  const { t } = useTranslation()
  const { id } = useDocumentInfo()

  const abortControllerRef = useRef(new AbortController())

  const [initialState, setInitialState] = useState<false | FormState | undefined>(false)

  const {
    field: { richTextComponentMap },
  } = useEditorConfigContext()

  const { getFormState } = useServerFunctions()

  const componentMapRenderedFieldsPath = `lexical_internal_feature.${featureKey}.fields${schemaPathSuffix ? `.${schemaPathSuffix}` : ''}`
  const schemaFieldsPath =
    schemaFieldsPathOverride ??
    `${schemaPath}.lexical_internal_feature.${featureKey}${schemaPathSuffix ? `.${schemaPathSuffix}` : ''}`

  const fields: any =
    fieldMapOverride ?? (richTextComponentMap?.get(componentMapRenderedFieldsPath) as ClientField[]) // Field Schema

  useEffect(() => {
    const abortController = new AbortController()

    const awaitInitialState = async () => {
      const { state } = await getFormState({
        id,
        data: data ?? {},
        operation: 'update',
        schemaPath: schemaFieldsPath,
        signal: abortController.signal,
      })

      setInitialState(state)
    }

    void awaitInitialState()

    return () => {
      try {
        abortController.abort()
      } catch (_err) {
        // swallow error
      }
    }
  }, [schemaFieldsPath, id, data, getFormState])

  const onChange = useCallback(
    async ({ formState: prevFormState }) => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort()
        } catch (_err) {
          // swallow error
        }
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      const { state } = await getFormState({
        id,
        formState: prevFormState,
        operation: 'update',
        schemaPath: schemaFieldsPath,
        signal: abortController.signal,
      })

      if (!state) {
        return prevFormState
      }

      return state
    },
    [schemaFieldsPath, id, getFormState],
  )

  // cleanup effect
  useEffect(() => {
    const abortController = abortControllerRef.current

    return () => {
      try {
        abortController.abort()
      } catch (_err) {
        // swallow error
      }
    }
  }, [])

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
      {/* Fields Here */}
      <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
    </Form>
  )
}
