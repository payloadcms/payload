'use client'
import type { FormState, SanitizedCollectionConfig } from 'payload/types'

import * as facelessUIImport from '@faceless-ui/modal'
import lexicalComposerContextImport from '@lexical/react/LexicalComposerContext.js'
const { useLexicalComposerContext } = lexicalComposerContextImport
import { getTranslation } from '@payloadcms/translations'
import {
  Drawer,
  FieldPathProvider,
  Form,
  type FormProps,
  FormSubmit,
  RenderFields,
  getFormState,
  useConfig,
  useDocumentInfo,
  useFieldPath,
  useTranslation,
} from '@payloadcms/ui'
import lexicalImport from 'lexical'
const { $getNodeByKey } = lexicalImport

import { deepCopyObject } from 'payload/utilities'
import React, { useCallback, useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

import type { UploadData, UploadNode } from '../../nodes/UploadNode.js'
import type { ElementProps } from '../index.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'

/**
 * This handles the extra fields, e.g. captions or alt text, which are
 * potentially added to the upload feature.
 */
export const ExtraFieldsUploadDrawer: React.FC<
  ElementProps & {
    drawerSlug: string
    relatedCollection: SanitizedCollectionConfig
  }
> = (props) => {
  const { useModal } = facelessUIImport

  const {
    data: { fields, relationTo, value },
    drawerSlug,
    nodeKey,
    relatedCollection,
  } = props

  const [editor] = useLexicalComposerContext()

  const { closeModal } = useModal()

  const { i18n, t } = useTranslation()
  const { id } = useDocumentInfo()
  const { schemaPath } = useFieldPath()
  const config = useConfig()
  const [initialState, setInitialState] = useState<FormState | false>(false)
  const {
    field: { richTextComponentMap },
  } = useEditorConfigContext()

  const componentMapRenderedFieldsPath = `feature.upload.fields.${relatedCollection.slug}`
  const schemaFieldsPath = `${schemaPath}.feature.upload.${relatedCollection.slug}`

  const fieldMap = richTextComponentMap.get(componentMapRenderedFieldsPath) // Field Schema

  useEffect(() => {
    const awaitInitialState = async () => {
      const state = await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          data: deepCopyObject(fields || {}),
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL: config.serverURL,
      }) // Form State

      setInitialState(state)
    }

    void awaitInitialState()
  }, [config.routes.api, config.serverURL, schemaFieldsPath, id, fields])

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      return await getFormState({
        apiRoute: config.routes.api,
        body: {
          id,
          formState: prevFormState,
          operation: 'update',
          schemaPath: schemaFieldsPath,
        },
        serverURL: config.serverURL,
      })
    },

    [config.routes.api, config.serverURL, schemaFieldsPath, id],
  )

  const handleUpdateEditData = useCallback(
    (_, data) => {
      // Update lexical node (with key nodeKey) with new data
      editor.update(() => {
        const uploadNode: UploadNode | null = $getNodeByKey(nodeKey)
        if (uploadNode) {
          const newData: UploadData = {
            ...uploadNode.getData(),
            fields: data,
          }
          uploadNode.setData(newData)
        }
      })

      closeModal(drawerSlug)
    },
    [closeModal, editor, drawerSlug, nodeKey],
  )

  return (
    <Drawer
      slug={drawerSlug}
      title={t('general:editLabel', {
        label: getTranslation(relatedCollection.labels.singular, i18n),
      })}
    >
      {initialState !== false && (
        <Form
          // @ts-expect-error // TODO: Fix this type. Is this correct?
          fields={fieldMap}
          initialState={initialState}
          onChange={[onChange]}
          onSubmit={handleUpdateEditData}
          uuid={uuid()}
        >
          <RenderFields
            fieldMap={Array.isArray(fieldMap) ? fieldMap : []}
            forceRender
            path=""
            readOnly={false}
            schemaPath=""
          />
          <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
        </Form>
      )}
    </Drawer>
  )
}
