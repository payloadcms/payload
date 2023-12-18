'use client'

import type { Fields } from 'payload/types'
import type { HTMLAttributes } from 'react'

import { useModal } from '@faceless-ui/modal'
import { Button, Popup } from 'payload/components'
import { useDrawerSlug } from 'payload/components/elements'
import { reduceFieldsToValues } from 'payload/components/forms'
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
import { Trans, useTranslation } from 'react-i18next'
import { Editor, Node, Transforms } from 'slate'
import { ReactEditor, useSlate } from 'slate-react'

import type { FieldProps } from '../../../../types'

import { LinkDrawer } from '../LinkDrawer'
import { transformExtraFields, unwrapLink } from '../utilities'
import './index.scss'

const baseClass = 'rich-text-link'

/**
 * This function is called when an existing link is edited.
 * When a link is first created, another function is called: {@link ../Button/index.tsx#insertLink}
 */
const insertChange = (editor, fields, customFieldSchema) => {
  const data = reduceFieldsToValues(fields, true)

  const [, parentPath] = Editor.above(editor)

  const newNode: Record<string, unknown> = {
    doc: data.doc,
    linkType: data.linkType,
    newTab: data.newTab,
    url: data.url,
  }

  if (customFieldSchema) {
    newNode.fields = data.fields
  }

  Transforms.setNodes(editor, newNode, { at: parentPath })

  Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'block' })
  Transforms.move(editor, { distance: 1, unit: 'offset' })
  Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path })

  ReactEditor.focus(editor)
}

export const LinkElement: React.FC<{
  attributes: HTMLAttributes<HTMLDivElement>
  children: React.ReactNode
  editorRef: React.RefObject<HTMLDivElement>
  element: any
  fieldProps: FieldProps
}> = (props) => {
  const { attributes, children, editorRef, element, fieldProps } = props

  const customFieldSchema = fieldProps?.admin?.link?.fields

  const editor = useSlate()
  const config = useConfig()
  const { user } = useAuth()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation('fields')
  const { closeModal, openModal, toggleModal } = useModal()
  const [renderModal, setRenderModal] = useState(false)
  const [renderPopup, setRenderPopup] = useState(false)
  const [initialState, setInitialState] = useState<Fields>({})
  const { getDocPreferences } = useDocumentInfo()
  const [fieldSchema] = useState(() => {
    const fieldsUnsanitized = transformExtraFields(customFieldSchema, config, i18n)
    // Sanitize custom fields here
    const validRelationships = config.collections.map((c) => c.slug) || []
    const fields = sanitizeFields({
      config: config,
      fields: fieldsUnsanitized,
      validRelationships,
    })

    return fields
  })

  const drawerSlug = useDrawerSlug('rich-text-link')

  const handleTogglePopup = useCallback((render) => {
    if (!render) {
      setRenderPopup(render)
    }
  }, [])

  useEffect(() => {
    const awaitInitialState = async () => {
      const data = {
        doc: element.doc,
        fields: deepCopyObject(element.fields),
        linkType: element.linkType,
        newTab: element.newTab,
        text: Node.string(element),
        url: element.url,
      }

      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
        config,
        data,
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
  }, [renderModal, element, fieldSchema, user, locale, t, getDocPreferences, config])

  return (
    <span className={baseClass} {...attributes}>
      <span contentEditable={false} style={{ userSelect: 'none' }}>
        {renderModal && (
          <LinkDrawer
            drawerSlug={drawerSlug}
            fieldSchema={fieldSchema}
            handleClose={() => {
              toggleModal(drawerSlug)
              setRenderModal(false)
            }}
            handleModalSubmit={(fields) => {
              insertChange(editor, fields, customFieldSchema)
              closeModal(drawerSlug)
            }}
            initialState={initialState}
          />
        )}
        <Popup
          boundingRef={editorRef}
          buttonType="none"
          forceOpen={renderPopup}
          horizontalAlign="left"
          onToggleOpen={handleTogglePopup}
          render={() => (
            <div className={`${baseClass}__popup`}>
              {element.linkType === 'internal' && element.doc?.relationTo && element.doc?.value && (
                <Trans
                  i18nKey="fields:linkedTo"
                  values={{
                    label: getTranslation(
                      config.collections.find(({ slug }) => slug === element.doc.relationTo)?.labels
                        ?.singular,
                      i18n,
                    ),
                  }}
                >
                  <a
                    className={`${baseClass}__link-label`}
                    href={`${config.routes.admin}/collections/${element.doc.relationTo}/${element.doc.value}`}
                    rel="noreferrer"
                    target="_blank"
                    title={`${config.routes.admin}/collections/${element.doc.relationTo}/${element.doc.value}`}
                  >
                    label
                  </a>
                </Trans>
              )}
              {(element.linkType === 'custom' || !element.linkType) && (
                <a
                  className={`${baseClass}__link-label`}
                  href={element.url}
                  rel="noreferrer"
                  target="_blank"
                  title={element.url}
                >
                  {element.url}
                </a>
              )}
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__link-edit`}
                icon="edit"
                onClick={(e) => {
                  e.preventDefault()
                  setRenderPopup(false)
                  openModal(drawerSlug)
                  setRenderModal(true)
                }}
                round
                tooltip={t('general:edit')}
              />
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__link-close`}
                icon="x"
                onClick={(e) => {
                  e.preventDefault()
                  unwrapLink(editor)
                }}
                round
                tooltip={t('general:remove')}
              />
            </div>
          )}
          size="fit-content"
          verticalAlign="bottom"
        />
      </span>
      <span
        className={[`${baseClass}__popup-toggler`].filter(Boolean).join(' ')}
        onClick={() => setRenderPopup(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setRenderPopup(true)
        }}
        role="button"
        tabIndex={0}
      >
        {children}
      </span>
    </span>
  )
}
