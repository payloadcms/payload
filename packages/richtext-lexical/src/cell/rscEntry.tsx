import type { Payload } from 'payload'

import { createHeadlessEditor } from '@lexical/headless'
import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { $getRoot } from 'lexical'
import LinkImport from 'next/link.js'
import React from 'react'

import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'
import type { LexicalFieldAdminProps, LexicalRichTextCellProps } from '../types.js'

import { getEnabledNodes } from '../lexical/nodes/index.js'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const RscEntryLexicalCell: React.FC<
  {
    admin: LexicalFieldAdminProps
    i18n: I18nClient
    payload: Payload
    sanitizedEditorConfig: SanitizedServerEditorConfig
  } & LexicalRichTextCellProps
> = (props) => {
  const {
    cellData,
    className: classNameFromProps,
    collectionConfig,
    field: { admin },
    field,
    i18n,
    link,
    onClick: onClickFromProps,
    payload,
    rowData,
    sanitizedEditorConfig,
  } = props

  const classNameFromConfigContext = admin && 'className' in admin ? admin.className : undefined

  const className =
    classNameFromProps ||
    (field.admin && 'className' in field.admin ? field.admin.className : null) ||
    classNameFromConfigContext
  const adminRoute = payload.config.routes.admin

  const onClick = onClickFromProps

  let WrapElement: React.ComponentType<any> | string = 'span'

  const wrapElementProps: {
    className?: string
    href?: string
    onClick?: () => void
    prefetch?: false
    type?: 'button'
  } = {
    className,
  }

  if (link) {
    wrapElementProps.prefetch = false
    WrapElement = Link
    wrapElementProps.href = collectionConfig?.slug
      ? formatAdminURL({
          adminRoute,
          path: `/collections/${collectionConfig?.slug}/${rowData.id}`,
        })
      : ''
  }

  if (typeof onClick === 'function') {
    WrapElement = 'button'
    wrapElementProps.type = 'button'
    wrapElementProps.onClick = () => {
      onClick({
        cellData,
        collectionSlug: collectionConfig?.slug,
        rowData,
      })
    }
  }

  let textContent = ''

  if (cellData) {
    // initialize headless editor
    const headlessEditor = createHeadlessEditor({
      namespace: sanitizedEditorConfig.lexical.namespace,
      nodes: getEnabledNodes({ editorConfig: sanitizedEditorConfig }),
      theme: sanitizedEditorConfig.lexical.theme,
    })
    const parsedEditorState = headlessEditor.parseEditorState(cellData)

    headlessEditor.setEditorState(parsedEditorState)

    textContent =
      headlessEditor.getEditorState().read(() => {
        return $getRoot().getTextContent()
      }) || ''
  }

  if (!cellData || !textContent?.length) {
    textContent = i18n.t('general:noLabel', {
      label: getTranslation(('label' in field ? field.label : null) || 'data', i18n),
    })
  }

  return <WrapElement {...wrapElementProps}>{textContent}</WrapElement>
}
