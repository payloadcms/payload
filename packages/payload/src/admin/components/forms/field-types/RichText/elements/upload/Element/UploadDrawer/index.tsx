import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Transforms } from 'slate'
import { ReactEditor, useSlateStatic } from 'slate-react'

import type { SanitizedCollectionConfig } from '../../../../../../../../../collections/config/types.js'
import type { ElementProps } from '../index.js'

import deepCopyObject from '../../../../../../../../../utilities/deepCopyObject.js'
import { getTranslation } from '../../../../../../../../../utilities/getTranslation.js'
import { Drawer } from '../../../../../../../elements/Drawer/index.js'
import { useAuth } from '../../../../../../../utilities/Auth/index.js'
import { useDocumentInfo } from '../../../../../../../utilities/DocumentInfo/index.js'
import { useLocale } from '../../../../../../../utilities/Locale/index.js'
import buildStateFromSchema from '../../../../../../Form/buildStateFromSchema/index.js'
import Form from '../../../../../../Form/index.js'
import RenderFields from '../../../../../../RenderFields/index.js'
import FormSubmit from '../../../../../../Submit/index.js'
import fieldTypes from '../../../../../index.js'

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
        t: t as any,
        user,
      })
      setInitialState(state)
    }

    awaitInitialState()
  }, [fieldSchema, element.fields, user, locale, t, getDocPreferences])

  return (
    <Drawer
      title={t('general:editLabel', {
        label: getTranslation(relatedCollection.labels.singular, i18n),
      })}
      slug={drawerSlug}
    >
      <Form initialState={initialState} onSubmit={handleUpdateEditData}>
        <RenderFields fieldSchema={fieldSchema} fieldTypes={fieldTypes} readOnly={false} />
        <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
      </Form>
    </Drawer>
  )
}
