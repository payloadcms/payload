'use client'
import type { FormState } from 'payload'

import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import {
  Form,
  RenderFields,
  useDocumentForm,
  useDocumentInfo,
  useServerFunctions,
} from '@payloadcms/ui'
import { abortAndIgnore } from '@payloadcms/ui/shared'
import { deepCopyObjectSimpleWithoutReactComponents } from 'payload/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import type { FieldsDrawerProps } from './Drawer.js'

import { useEditorConfigContext } from '../../lexical/config/client/EditorConfigProvider.js'
import { RegisterFormSubmit } from './useDrawerSubmit.js'
import './index.css'

export const DrawerContent: React.FC<
  {
    submitRef: React.RefObject<(() => void) | null>
  } & Omit<FieldsDrawerProps, 'drawerSlug' | 'drawerTitle'>
> = ({
  data,
  featureKey,
  fieldMapOverride,
  handleDrawerSubmit,
  schemaFieldsPathOverride,
  schemaPath,
  schemaPathSuffix,
  submitRef,
}) => {
  const { id, collectionSlug, getDocPreferences, globalSlug } = useDocumentInfo()
  const { fields: parentDocumentFields } = useDocumentForm()
  const isEditable = useLexicalEditable()

  const onChangeAbortControllerRef = useRef(new AbortController())

  const [initialState, setInitialState] = useState<false | FormState | undefined>(false)

  const {
    fieldProps: { featureClientSchemaMap },
  } = useEditorConfigContext()

  const { getFormState } = useServerFunctions()

  const schemaFieldsPath =
    schemaFieldsPathOverride ??
    `${schemaPath}.lexical_internal_feature.${featureKey}${schemaPathSuffix ? `.${schemaPathSuffix}` : ''}`

  const fields: any = fieldMapOverride ?? featureClientSchemaMap[featureKey]?.[schemaFieldsPath] // Field Schema

  useEffect(() => {
    const controller = new AbortController()

    const awaitInitialState = async () => {
      const { state } = await getFormState({
        id,
        collectionSlug,
        data: data ?? {},
        docPermissions: {
          fields: true,
        },
        docPreferences: await getDocPreferences(),
        documentFormState: deepCopyObjectSimpleWithoutReactComponents(parentDocumentFields, {
          excludeFiles: true,
        }),
        globalSlug,
        initialBlockData: data,
        operation: 'update',
        readOnly: !isEditable,
        renderAllFields: true,
        schemaPath: schemaFieldsPath,
        signal: controller.signal,
      })

      setInitialState(state)
    }

    void awaitInitialState()

    return () => {
      abortAndIgnore(controller)
    }
  }, [
    schemaFieldsPath,
    id,
    data,
    getFormState,
    collectionSlug,
    isEditable,
    globalSlug,
    getDocPreferences,
    parentDocumentFields,
  ])

  const onChange = useCallback(
    async ({ formState: prevFormState }: { formState: FormState }) => {
      abortAndIgnore(onChangeAbortControllerRef.current)

      const controller = new AbortController()
      onChangeAbortControllerRef.current = controller

      const { state } = await getFormState({
        id,
        collectionSlug,
        docPermissions: {
          fields: true,
        },
        docPreferences: await getDocPreferences(),
        documentFormState: deepCopyObjectSimpleWithoutReactComponents(parentDocumentFields, {
          excludeFiles: true,
        }),
        formState: prevFormState,
        globalSlug,
        initialBlockFormState: prevFormState,
        operation: 'update',
        readOnly: !isEditable,
        schemaPath: schemaFieldsPath,
        signal: controller.signal,
      })

      if (!state) {
        return prevFormState
      }

      return state
    },
    [
      getFormState,
      id,
      isEditable,
      collectionSlug,
      getDocPreferences,
      parentDocumentFields,
      globalSlug,
      schemaFieldsPath,
    ],
  )

  // cleanup effect
  useEffect(() => {
    return () => {
      abortAndIgnore(onChangeAbortControllerRef.current)
    }
  }, [])

  if (initialState === false) {
    return null
  }

  return (
    <Form
      beforeSubmit={[onChange]}
      className="fields-drawer"
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
        permissions={true}
        readOnly={!isEditable}
      />
      <RegisterFormSubmit submitRef={submitRef} />
    </Form>
  )
}
