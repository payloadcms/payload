'use client'

import type { FormProps } from '@payloadcms/ui'
import type { ClientCollectionConfig, FormState } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  Drawer,
  Form,
  FormSubmit,
  RenderFields,
  useConfig,
  useDocumentInfo,
  useLocale,
  useModal,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import { deepCopyObject } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, useSlateStatic } from 'slate-react'

import type { LoadedSlateFieldProps } from '../../../../types.js'
import type { UploadElementType } from '../../types.js'

import { uploadFieldsSchemaPath } from '../../shared.js'

export const UploadDrawer: React.FC<{
  readonly drawerSlug: string
  readonly element: UploadElementType
  readonly fieldProps: LoadedSlateFieldProps
  readonly relatedCollection: ClientCollectionConfig
  readonly schemaPath: string
}> = (props) => {
  const editor = useSlateStatic()

  const { drawerSlug, element, fieldProps, relatedCollection, schemaPath } = props

  const { i18n, t } = useTranslation()
  const { code: locale } = useLocale()
  const { closeModal } = useModal()
  const { id, collectionSlug } = useDocumentInfo()

  const { serverFunctions } = useServerFunctions()

  const [initialState, setInitialState] = useState({})
  const {
    field: { richTextComponentMap },
  } = fieldProps

  const relatedFieldSchemaPath = `${uploadFieldsSchemaPath}.${relatedCollection.slug}`
  const fields = richTextComponentMap.get(relatedFieldSchemaPath)

  const { config } = useConfig()

  const handleUpdateEditData = useCallback(
    (_, data) => {
      const newNode = {
        fields: data,
      }

      const elementPath = ReactEditor.findPath(editor, element)

      Transforms.setNodes(editor, newNode, { at: elementPath })
      closeModal(drawerSlug)
    },
    [closeModal, editor, element, drawerSlug],
  )

  useEffect(() => {
    const data = deepCopyObject(element?.fields || {})

    const awaitInitialState = async () => {
      const { state } = (await serverFunctions({
        name: 'form-state',
        args: {
          id,
          collectionSlug,
          data,
          operation: 'update',
          schemaPath: `${schemaPath}.${uploadFieldsSchemaPath}.${relatedCollection.slug}`,
        },
      })) as { state: FormState } // TODO: remove this when strictNullChecks is enabled and the return type can be inferred

      setInitialState(state)
    }

    void awaitInitialState()
  }, [
    config,
    element?.fields,
    locale,
    t,
    collectionSlug,
    id,
    schemaPath,
    relatedCollection.slug,
    serverFunctions,
  ])

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const { state } = (await serverFunctions({
        name: 'form-state',
        args: {
          id,
          formState: prevFormState,
          operation: 'update',
          schemaPath: `${schemaPath}.${uploadFieldsSchemaPath}.${relatedCollection.slug}`,
        },
      })) as { state: FormState } // TODO: remove this when strictNullChecks is enabled and the return type can be inferred

      return state
    },

    [relatedCollection.slug, schemaPath, id, serverFunctions],
  )

  return (
    <Drawer
      slug={drawerSlug}
      title={t('general:editLabel', {
        label: getTranslation(relatedCollection.labels.singular, i18n),
      })}
    >
      <Form
        beforeSubmit={[onChange]}
        disableValidationOnSubmit
        initialState={initialState}
        onChange={[onChange]}
        onSubmit={handleUpdateEditData}
      >
        <RenderFields
          fields={Array.isArray(fields) ? fields : []}
          path=""
          readOnly={false}
          schemaPath=""
        />
        <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
      </Form>
    </Drawer>
  )
}
