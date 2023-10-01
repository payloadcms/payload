import type { SanitizedCollectionConfig } from 'payload/types'

import { useModal } from '@faceless-ui/modal'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey } from 'lexical'
import { Drawer } from 'payload/components/elements'
import { Form, FormSubmit, RenderFields } from 'payload/components/forms'
import {
  buildStateFromSchema,
  useAuth,
  useDocumentInfo,
  useLocale,
} from 'payload/components/utilities'
import { fieldTypes } from 'payload/config'
import { deepCopyObject, getTranslation } from 'payload/utilities'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ElementProps } from '..'
import type { UploadFeatureProps } from '../..'
import type { UploadNode } from '../../nodes/UploadNode'

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
    drawerSlug,
    fields: { relationTo, value },
    fields,
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
  const fieldSchema = (editorConfig?.resolvedFeatureMap.get('upload')?.props as UploadFeatureProps)
    ?.collections?.[relatedCollection.slug]?.fields

  const handleUpdateEditData = useCallback(
    (_, data) => {
      // Update lexical node (with key nodeKey) with new data
      editor.update(() => {
        const uploadNode: UploadNode | null = $getNodeByKey(nodeKey)
        if (uploadNode) {
          const newFields = {
            ...uploadNode.getFields(),
            ...data,
          }
          uploadNode.setFields(newFields)
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
        data: deepCopyObject(fields || {}),
        fieldSchema,
        locale,
        operation: 'update',
        preferences,
        t,
        user,
      })
      setInitialState(state)
    }

    void awaitInitialState()
  }, [user, locale, t, getDocPreferences, fields, fieldSchema])

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
