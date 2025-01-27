'use client'

import type { SanitizedCollectionConfig } from 'payload/types'

import { useModal } from '@faceless-ui/modal'
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
import { Transforms } from 'slate'
import { ReactEditor, useSlateStatic } from 'slate-react'

import type { ElementProps } from '..'

export const UploadDrawer: React.FC<
  ElementProps & {
    drawerSlug: string
    relatedCollection: SanitizedCollectionConfig
  }
> = (props) => {
  const editor = useSlateStatic()

  const { drawerSlug, element, fieldProps, relatedCollection } = props

  const { i18n, t } = useTranslation()
  const { code: locale } = useLocale()
  const { user } = useAuth()
  const { closeModal } = useModal()
  const { getDocPreferences } = useDocumentInfo()
  const [initialState, setInitialState] = useState({})
  const fieldSchemaUnsanitized =
    fieldProps?.admin?.upload?.collections?.[relatedCollection.slug]?.fields
  const config = useConfig()

  // Sanitize custom fields here
  const validRelationships = config.collections.map((c) => c.slug) || []
  const fieldSchema = sanitizeFields({
    config: config,
    fields: fieldSchemaUnsanitized,
    validRelationships,
  })

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
    // Sanitize custom fields here
    const validRelationships = config.collections.map((c) => c.slug) || []
    const fieldSchema = sanitizeFields({
      config: config,
      fields: fieldSchemaUnsanitized,
      validRelationships,
    })

    const awaitInitialState = async () => {
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
        config,
        data: deepCopyObject(element?.fields || {}),
        fieldSchema,
        locale,
        operation: 'update',
        preferences,
        t,
        user,
      })
      setInitialState(state)
    }

    awaitInitialState()
  }, [fieldSchemaUnsanitized, config, element.fields, user, locale, t, getDocPreferences])

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
