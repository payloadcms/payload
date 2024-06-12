'use client'
import type { FormProps } from '@payloadcms/ui/forms/Form'
import type { ClientCollectionConfig, FormState } from 'payload/types'

import { useModal } from '@faceless-ui/modal'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { getTranslation } from '@payloadcms/translations'
import { Drawer } from '@payloadcms/ui/elements/Drawer'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { Form } from '@payloadcms/ui/forms/Form'
import { RenderFields } from '@payloadcms/ui/forms/RenderFields'
import { FormSubmit } from '@payloadcms/ui/forms/Submit'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useDocumentInfo } from '@payloadcms/ui/providers/DocumentInfo'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { getFormState } from '@payloadcms/ui/utilities/getFormState'
import { $getNodeByKey } from 'lexical'
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
    relatedCollection: ClientCollectionConfig
  }
> = (props) => {
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
  const { schemaPath } = useFieldProps()
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
          beforeSubmit={[onChange]}
          disableValidationOnSubmit
          // @ts-expect-error TODO: Fix this
          fields={fieldMap}
          initialState={initialState}
          onChange={[onChange]}
          onSubmit={handleUpdateEditData}
          uuid={uuid()}
        >
          <RenderFields
            fieldMap={Array.isArray(fieldMap) ? fieldMap : []}
            forceRender
            path="" // See Blocks feature path for details as for why this is empty
            readOnly={false}
            schemaPath={schemaFieldsPath}
          />
          <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
        </Form>
      )}
    </Drawer>
  )
}
