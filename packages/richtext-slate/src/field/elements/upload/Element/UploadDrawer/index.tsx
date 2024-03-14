'use client'

import type { FormFieldBase } from '@payloadcms/ui/types'
import type { SanitizedCollectionConfig } from 'payload/types'

import * as facelessUIImport from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import {
  Drawer,
  Form,
  FormSubmit,
  RenderFields,
  getFormState,
  useAuth,
  useConfig,
  useDocumentInfo,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { FieldPathProvider } from '@payloadcms/ui/forms'
import { deepCopyObject } from 'payload/utilities'
import React, { useCallback, useEffect, useState } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, useSlateStatic } from 'slate-react'

import type { UploadElementType } from '../../types.js'

import { uploadFieldsSchemaPath } from '../../shared.js'

export const UploadDrawer: React.FC<{
  drawerSlug: string
  element: UploadElementType
  fieldProps: FormFieldBase & {
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  }
  relatedCollection: SanitizedCollectionConfig
  schemaPath: string
}> = (props) => {
  const { useModal } = facelessUIImport

  const editor = useSlateStatic()

  const { drawerSlug, element, fieldProps, relatedCollection, schemaPath } = props

  const { i18n, t } = useTranslation()
  const { code: locale } = useLocale()
  const { user } = useAuth()
  const { closeModal } = useModal()
  const { id, collectionSlug } = useDocumentInfo()
  const [initialState, setInitialState] = useState({})
  const { richTextComponentMap } = fieldProps

  const relatedFieldSchemaPath = `${uploadFieldsSchemaPath}.${relatedCollection.slug}`
  const fieldMap = richTextComponentMap.get(relatedFieldSchemaPath)

  const config = useConfig()

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
      const state = await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          collectionSlug,
          data,
          operation: 'update',
          schemaPath: `${schemaPath}.${uploadFieldsSchemaPath}.${relatedCollection.slug}`,
        },
        serverURL: config.serverURL,
      })

      setInitialState(state)
    }

    void awaitInitialState()
  }, [
    config,
    element?.fields,
    user,
    locale,
    t,
    collectionSlug,
    id,
    schemaPath,
    relatedCollection.slug,
  ])

  return (
    <Drawer
      slug={drawerSlug}
      title={t('general:editLabel', {
        label: getTranslation(relatedCollection.labels.singular, i18n),
      })}
    >
      <Form initialState={initialState} onSubmit={handleUpdateEditData}>
        <RenderFields
          fieldMap={Array.isArray(fieldMap) ? fieldMap : []}
          path=""
          readOnly={false}
          schemaPath=""
        />
        <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
      </Form>
    </Drawer>
  )
}
