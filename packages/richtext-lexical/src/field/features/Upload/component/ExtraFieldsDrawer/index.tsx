import type { SanitizedCollectionConfig } from 'payload/types'

import { useModal } from '@faceless-ui/modal'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
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
  const [editor] = useLexicalComposerContext()
  const { field } = useEditorConfigContext()

  const {
    drawerSlug,
    fields: { relationTo, value },
    nodeKey,
    relatedCollection,
  } = props

  const { i18n, t } = useTranslation()
  const { code: locale } = useLocale()
  const { user } = useAuth()
  const { closeModal } = useModal()
  const { getDocPreferences } = useDocumentInfo()
  const [initialState, setInitialState] = useState({})
  //const fieldSchema = field?.admin?.upload?.collections?.[relatedCollection.slug]?.fields // TODO:

  const handleUpdateEditData = useCallback(
    (_, data) => {
      const newNode = {
        fields: data,
      }
      // TODO

      closeModal(drawerSlug)
    },
    [closeModal, editor, drawerSlug],
  )

  useEffect(() => {
    const awaitInitialState = async () => {
      const preferences = await getDocPreferences()
      /*const state = await buildStateFromSchema({
        data: deepCopyObject(element?.fields || {}),
        fieldSchema,
        locale,
        operation: 'update',
        preferences,
        t,
        user,
      })
      setInitialState(state)*/
    }

    awaitInitialState()
  }, [user, locale, t, getDocPreferences])

  return (
    <Drawer
      slug={drawerSlug}
      title={t('general:editLabel', {
        label: getTranslation(relatedCollection.labels.singular, i18n),
      })}
    >
      <Form initialState={initialState} onSubmit={handleUpdateEditData}>
        <RenderFields fieldSchema={null /** TODO */} fieldTypes={fieldTypes} readOnly={false} />
        <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
      </Form>
    </Drawer>
  )
}
