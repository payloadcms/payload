import type { SanitizedCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getFieldComponent, staticFieldTypes } from 'payload'
import { deepCopyObject } from 'payload'
import { getTranslation } from 'payload'
import { Drawer } from 'payload'
import { useAuth } from 'payload'
import { useDocumentInfo } from 'payload'
import { useLocale } from 'payload'
import { Form } from 'payload'
import { buildStateFromSchema } from 'payload'
import { RenderFields } from 'payload'
import { FormSubmit } from 'payload'
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
  const fieldSchema = fieldProps?.admin?.upload?.collections?.[relatedCollection.slug]?.fields

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
    const awaitInitialState = async () => {
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
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
  }, [fieldSchema, element.fields, user, locale, t, getDocPreferences])

  return (
    <Drawer
      slug={drawerSlug}
      title={t('general:editLabel', {
        label: getTranslation(relatedCollection.labels.singular, i18n),
      })}
    >
      <Form initialState={initialState} onSubmit={handleUpdateEditData}>
        <RenderFields
          fieldComponentProvider={getFieldComponent}
          fieldSchema={fieldSchema}
          readOnly={false}
          staticFieldTypes={staticFieldTypes}
        />
        <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
      </Form>
    </Drawer>
  )
}
