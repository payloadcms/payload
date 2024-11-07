'use client'
import type { FormState } from 'payload'

import {
  Form,
  FormSubmit,
  RenderFields,
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
  const { id, collectionSlug, docPermissions, getDocPreferences, globalSlug } = useDocumentInfo()

  const abortControllerRef = useRef(new AbortController())

  const [initialState, setInitialState] = useState<false | FormState | undefined>(false)

  const {
    fieldProps: { featureClientSchemaMap, permissions },
  } = useEditorConfigContext()

  const { getFormState } = useServerFunctions()

  const schemaFieldsPath =
    schemaFieldsPathOverride ??
    `${schemaPath}.lexical_internal_feature.${featureKey}${schemaPathSuffix ? `.${schemaPathSuffix}` : ''}`

  const fields: any = fieldMapOverride ?? featureClientSchemaMap[featureKey]?.[schemaFieldsPath] // Field Schema

  useEffect(() => {
    const abortController = new AbortController()

    const awaitInitialState = async () => {
      const { state } = await getFormState({
        id,
        collectionSlug,
        data: data ?? {},
        docPermissions,
        docPreferences: await getDocPreferences(),
        doNotAbort: true,
        globalSlug,
        operation: 'update',
        renderAllFields: true,
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
  }, [
    schemaFieldsPath,
    id,
    data,
    getFormState,
    collectionSlug,
    globalSlug,
    docPermissions,
    getDocPreferences,
  ])

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
        collectionSlug,
        docPermissions,
        docPreferences: await getDocPreferences(),
        formState: prevFormState,
        globalSlug,
        operation: 'update',
        schemaPath: schemaFieldsPath,
        signal: abortController.signal,
      })

      if (!state) {
        return prevFormState
      }

      return state
    },
    [
      getFormState,
      id,
      collectionSlug,
      docPermissions,
      getDocPreferences,
      globalSlug,
      schemaFieldsPath,
    ],
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
      <RenderFields
        fields={Array.isArray(fields) ? fields : []}
        forceRender
        parentIndexPath=""
        parentPath="" // See Blocks feature path for details as for why this is empty
        parentSchemaPath={schemaFieldsPath}
        permissions={permissions}
        readOnly={false}
      />
      <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
    </Form>
  )
}
