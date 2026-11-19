'use client'
import type { FormState } from 'payload'

import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import {
  Form,
  RenderFields,
  useDocumentForm,
  useDocumentInfo,
  useEffectEvent,
  useOperation,
  useServerFunctions,
} from '@payloadcms/ui'
import { abortAndIgnore } from '@payloadcms/ui/shared'
import React, { useEffect, useState } from 'react'
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
  handleDrawerInitialize,
  handleDrawerSubmit,
  schemaFieldsPathOverride,
  schemaPath,
  schemaPathSuffix,
  submitRef,
}) => {
  const { id, collectionSlug, getDocPreferences, globalSlug } = useDocumentInfo()
  const { fields: parentDocumentFields } = useDocumentForm()
  const isEditable = useLexicalEditable()
  const operation = useOperation()

  const [initialState, setInitialState] = useState<false | FormState | undefined>(false)
  // Updating the node's defaults must not restart the open drawer's editing session.
  const [initialData] = useState(data)

  const {
    fieldProps: { featureClientSchemaMap },
  } = useEditorConfigContext()

  const { getFormState } = useServerFunctions()

  const schemaFieldsPath =
    schemaFieldsPathOverride ??
    `${schemaPath}.lexical_internal_feature.${featureKey}${schemaPathSuffix ? `.${schemaPathSuffix}` : ''}`

  const fields: any = fieldMapOverride ?? featureClientSchemaMap[featureKey]?.[schemaFieldsPath] // Field Schema

  // Parent autosave updates this context without starting a new drawer editing session.
  const getParentDocumentFields = useEffectEvent(() => parentDocumentFields)
  const initializeNode = useEffectEvent((formState: FormState) => {
    handleDrawerInitialize?.({ formState })
  })

  useEffect(() => {
    const controller = new AbortController()

    const awaitInitialState = async () => {
      const { state } = await getFormState({
        id,
        collectionSlug,
        data: initialData ?? {},
        docPermissions: {
          fields: true,
        },
        docPreferences: await getDocPreferences(),
        documentFormState: getParentDocumentFields(),
        globalSlug,
        initialBlockData: initialData,
        operation,
        readOnly: !isEditable,
        renderAllFields: true,
        schemaPath: schemaFieldsPath,
        signal: controller.signal,
      })

      if (!controller.signal.aborted && state) {
        initializeNode(state)
        setInitialState(state)
      }
    }

    void awaitInitialState()

    return () => {
      abortAndIgnore(controller)
    }
  }, [
    schemaFieldsPath,
    id,
    initialData,
    getFormState,
    collectionSlug,
    isEditable,
    globalSlug,
    getDocPreferences,
    operation,
  ])

  if (initialState === false) {
    return null
  }

  return (
    <Form
      className="fields-drawer"
      disableValidationOnSubmit
      fields={Array.isArray(fields) ? fields : []}
      initialState={initialState}
      onSubmit={handleDrawerSubmit}
      readOnly={!isEditable}
      schemaPath={schemaFieldsPath}
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
