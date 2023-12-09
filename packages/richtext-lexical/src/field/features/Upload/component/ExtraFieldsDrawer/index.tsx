import type { GroupField, SanitizedCollectionConfig } from 'payload/types'

import { useModal } from '@faceless-ui/modal'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey } from 'lexical'
import { Drawer } from 'payload/components/elements'
import { Form, FormSubmit, RenderFields, fieldTypes } from 'payload/components/forms'
import {
  buildStateFromSchema,
  useAuth,
  useConfig,
  useDocumentInfo,
  useLocale,
} from 'payload/components/utilities'
import { sanitizeFields } from 'payload/config'
import { deepCopyObject, getTranslation } from 'payload/utilities'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ElementProps } from '..'
import type { UploadFeatureProps } from '../..'
import type { UploadData, UploadNode } from '../../nodes/UploadNode'

import { useEditorConfigContext } from '../../../../lexical/config/EditorConfigProvider'

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
  const {
    data: { fields },
    drawerSlug,
    nodeKey,
    relatedCollection,
  } = props

  const [editor] = useLexicalComposerContext()
  const { editorConfig, uuid } = useEditorConfigContext()

  const { i18n, t } = useTranslation()
  const { code: locale } = useLocale()
  const { user } = useAuth()
  const { closeModal } = useModal()
  const { getDocPreferences } = useDocumentInfo()
  const [initialState, setInitialState] = useState(null)
  const [sanitizedFieldSchema, setSanitizedFieldSchema] = useState(null)
  const [groupFieldName, setGroupFieldName] = useState(null)

  const config = useConfig()

  const handleUpdateEditData = useCallback(
    (_, data) => {
      // Update lexical node (with key nodeKey) with new data
      editor.update(() => {
        const uploadNode: UploadNode | null = $getNodeByKey(nodeKey)
        if (uploadNode) {
          console.log('uploadNodedata', data[groupFieldName])
          const newData: UploadData = {
            ...uploadNode.getData(),
            fields: groupFieldName ? data[groupFieldName] : null,
          }
          uploadNode.setData(newData)
        }
      })

      closeModal(drawerSlug)
    },
    [closeModal, editor, drawerSlug, nodeKey, groupFieldName],
  )

  useEffect(() => {
    const newGroupFieldName = `uploadDrawer_fields_${uuid}`
    setGroupFieldName(newGroupFieldName)
    const groupField: GroupField = {
      name: newGroupFieldName,
      admin: {
        style: {
          borderBottom: 0,
          borderTop: 0,
          margin: 0,
          padding: 0,
        },
      },
      fields: [],
      label: '',
      type: 'group',
    }

    groupField.fields = (
      editorConfig?.resolvedFeatureMap.get('upload')?.props as UploadFeatureProps
    )?.collections?.[relatedCollection.slug]?.fields

    // Sanitize custom fields here
    const validRelationships = config.collections.map((c) => c.slug) || []
    const fieldSchema = sanitizeFields({
      config: config,
      fields: [groupField],
      validRelationships,
    })

    setSanitizedFieldSchema(fieldSchema)

    const awaitInitialState = async () => {
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
        config,
        data: {
          [newGroupFieldName]: deepCopyObject(fields || {}),
        },
        fieldSchema,
        locale,
        operation: 'update',
        preferences,
        t,
        user,
      })
      setInitialState(state || {})
    }

    void awaitInitialState()
  }, [
    user,
    locale,
    t,
    getDocPreferences,
    fields,
    uuid,
    config,
    relatedCollection.slug,
    editorConfig?.resolvedFeatureMap,
  ])

  return (
    <Drawer
      slug={drawerSlug}
      title={t('general:editLabel', {
        label: getTranslation(relatedCollection.labels.singular, i18n),
      })}
    >
      {sanitizedFieldSchema && initialState && (
        <Form
          fields={sanitizedFieldSchema}
          initialState={initialState}
          onSubmit={handleUpdateEditData}
        >
          <RenderFields
            fieldSchema={sanitizedFieldSchema}
            fieldTypes={fieldTypes}
            readOnly={false}
          />
          <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
        </Form>
      )}
    </Drawer>
  )
}
