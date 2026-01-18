import type { SerializedLexicalNode } from 'lexical'

import { getTranslation } from '@ruya.sa/translations'
import { Link } from '@ruya.sa/ui'
import { formatAdminURL } from '@ruya.sa/payload/shared'
import React from 'react'

import type { LexicalRichTextCellProps } from '../types.js'

function recurseEditorState(
  editorState: SerializedLexicalNode[],
  textContent: React.ReactNode[],
  i: number = 0,
): React.ReactNode[] {
  for (const node of editorState) {
    i++
    if ('text' in node && node.text) {
      textContent.push(node.text as string)
    } else {
      if (!('children' in node)) {
        textContent.push(<code key={i}>&#32;[{node.type}]</code>)
      }
    }
    if ('children' in node && node.children) {
      textContent = recurseEditorState(node.children as SerializedLexicalNode[], textContent, i)
    }
  }
  return textContent
}

export const RscEntryLexicalCell: React.FC<LexicalRichTextCellProps> = (props) => {
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
  } = props

  const classNameFromConfigContext = admin && 'className' in admin ? admin.className : undefined

  const className =
    classNameFromProps ||
    (field.admin && 'className' in field.admin ? field.admin.className : null) ||
    classNameFromConfigContext
  const adminRoute = payload.config.routes.admin
  const serverURL = payload.config.serverURL

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
          serverURL,
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

  let textContent: React.ReactNode[] = []

  if (cellData?.root?.children) {
    textContent = recurseEditorState(cellData?.root?.children, textContent)
  }

  if (!textContent?.length) {
    textContent = [
      i18n.t('general:noLabel', {
        label: getTranslation(('label' in field ? field.label : null) || 'data', i18n),
      }),
    ]
  }

  return <WrapElement {...wrapElementProps}>{textContent}</WrapElement>
}
