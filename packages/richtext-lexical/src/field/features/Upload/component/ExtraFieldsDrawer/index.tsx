import type { Field, SanitizedCollectionConfig } from 'payload/types'

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
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ElementProps } from '..'
import type { UploadFeatureProps } from '../..'
import type { BlocksFeatureProps } from '../../../Blocks'
import type { UploadData, UploadNode } from '../../nodes/UploadNode'

import { useEditorConfigContext } from '../../../../lexical/config/EditorConfigProvider'
import { transformInputFormSchema } from '../../../Blocks/utils/transformInputFormSchema'

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
    data: { fields, relationTo, value },
    drawerSlug,
    nodeKey,
    relatedCollection,
  } = props

  const [editor] = useLexicalComposerContext()
  const { editorConfig, field } = useEditorConfigContext()

  const { i18n, t } = useTranslation()
  const { code: locale } = useLocale()
  const { user } = useAuth()
  const { closeModal } = useModal()
  const { getDocPreferences } = useDocumentInfo()
  const [initialState, setInitialState] = useState({})

  const config = useConfig()

  const fieldSchema = useMemo(() => {
    const fieldSchemaUnSanitized = (
      editorConfig?.resolvedFeatureMap.get('upload')?.props as UploadFeatureProps
    )?.collections?.[relatedCollection.slug]?.fields

    const validRelationships = config.collections.map((c) => c.slug) || []
    // Sanitize custom fields here
    return sanitizeFields({
      config,
      fields: fieldSchemaUnSanitized,
      requireFieldLevelRichTextEditor: true,
      validRelationships,
    })
  }, [config, editorConfig?.resolvedFeatureMap, relatedCollection.slug])

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

  useEffect(() => {
    const awaitInitialState = async () => {
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
        config,
        data: fields ? deepCopyObject(fields) : {},
        fieldSchema,
        locale,
        operation: 'update',
        preferences,
        t,
        user,
      })
      setInitialState(state)
    }

    if (fieldSchema) {
      void awaitInitialState()
    }
  }, [user, locale, t, getDocPreferences, fields, fieldSchema, config])

  return (
    <Drawer
      slug={drawerSlug}
      title={t('general:editLabel', {
        label: getTranslation(relatedCollection.labels.singular, i18n),
      })}
    >
      <Form initialState={initialState} onSubmit={handleUpdateEditData}>
        <RenderFields fieldSchema={fieldSchema} fieldTypes={fieldTypes} readOnly={false} />
        <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
      </Form>
    </Drawer>
  )
}
