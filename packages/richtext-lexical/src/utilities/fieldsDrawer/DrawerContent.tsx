'use client'

import type { FormState } from 'payload'

import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import {
  Form,
  FormSubmit,
  RenderFields,
  useDocumentForm,
  useDocumentInfo,
  useForm,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import { abortAndIgnore } from '@payloadcms/ui/shared'
import { deepCopyObjectSimpleWithoutReactComponents } from 'payload/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import type { FieldsDrawerProps } from './Drawer.js'

import { useEditorConfigContext } from '../../lexical/config/client/EditorConfigProvider.js'
import { RenderLexicalFields } from '../RenderLexicalFields.js'

/**
 * Standalone form-based drawer content for creation drawers (no nodeId).
 * Uses its own `<Form>` with server-side form state initialization.
 */
const StandaloneDrawerContent: React.FC<
  Omit<FieldsDrawerProps, 'drawerSlug' | 'drawerTitle' | 'nodeId' | 'nodeKey'>
> = ({
  data,
  featureKey,
  fieldMapOverride,
  handleDrawerSubmit,
  schemaFieldsPathOverride,
  schemaPath,
  schemaPathSuffix,
}) => {
  const { t } = useTranslation()
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

  const fields: any = fieldMapOverride ?? featureClientSchemaMap[featureKey]?.[schemaFieldsPath]

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
        parentPath=""
        parentSchemaPath={schemaFieldsPath}
        permissions={true}
        readOnly={!isEditable}
      />
      <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
    </Form>
  )
}

/**
 * Inline drawer content for node editing drawers (with nodeId).
 * Fields render within the parent document form state.
 */
const InlineDrawerContent: React.FC<
  {
    nodeId: string
  } & Omit<FieldsDrawerProps, 'data' | 'drawerSlug' | 'drawerTitle'>
> = ({
  featureKey,
  fieldMapOverride,
  handleDrawerSubmit,
  nodeId,
  nodeKey,
  schemaFieldsPathOverride,
  schemaPath,
  schemaPathSuffix,
}) => {
  const { t } = useTranslation()
  const isEditable = useLexicalEditable()
  const { fields: formFields, getDataByPath } = useForm()

  const {
    fieldProps: { featureClientSchemaMap, path },
  } = useEditorConfigContext()

  const schemaFieldsPath =
    schemaFieldsPathOverride ??
    `${schemaPath}.lexical_internal_feature.${featureKey}${schemaPathSuffix ? `.${schemaPathSuffix}` : ''}`

  const fields: any = fieldMapOverride ?? featureClientSchemaMap[featureKey]?.[schemaFieldsPath]

  const parentPath = `${path}.${nodeId}`

  const onClick = useCallback(() => {
    const data = getDataByPath(parentPath) ?? {}
    handleDrawerSubmit(formFields, data)
  }, [parentPath, getDataByPath, formFields, handleDrawerSubmit])

  const fieldProps = {
    fields: Array.isArray(fields) ? fields : [],
    forceRender: true as const,
    parentIndexPath: '',
    parentPath,
    parentSchemaPath: schemaFieldsPath,
    permissions: true as const,
    readOnly: !isEditable,
  }

  return (
    <>
      {nodeKey ? (
        <RenderLexicalFields {...fieldProps} nodeKey={nodeKey} />
      ) : (
        <RenderFields {...fieldProps} />
      )}
      <FormSubmit onClick={onClick}>{t('fields:saveChanges')}</FormSubmit>
    </>
  )
}

export const DrawerContent: React.FC<Omit<FieldsDrawerProps, 'drawerSlug' | 'drawerTitle'>> = (
  props,
) => {
  if (props.nodeId) {
    return <InlineDrawerContent {...props} nodeId={props.nodeId} />
  }

  return <StandaloneDrawerContent {...props} />
}
