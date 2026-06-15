'use client'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

import { Link } from '../../elements/Link/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useDocumentTitle } from '../../providers/DocumentTitle/index.js'
import { IDLabel } from '../IDLabel/index.js'
import './index.css'

const baseClass = 'render-title'

export type RenderTitleProps = {
  className?: string
  element?: React.ElementType
  fallback?: string
  fallbackToID?: boolean
  /**
   * When true, renders the title as a link to the document. Useful inside drawers
   * to navigate to the full document view.
   */
  renderAsLink?: boolean
  title?: string
}

export const RenderTitle: React.FC<RenderTitleProps> = (props) => {
  const { className, element = 'h1', fallback, renderAsLink, title: titleFromProps } = props

  const { id, collectionSlug, globalSlug, isInitializing } = useDocumentInfo()
  const { title: titleFromContext } = useDocumentTitle()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const title = titleFromProps || titleFromContext || fallback

  const idAsTitle = title === id

  const Tag = element

  // Render and invisible character to prevent layout shift when the title populates from context
  const EmptySpace = <Fragment>&nbsp;</Fragment>

  const docPath =
    renderAsLink && id && (collectionSlug || globalSlug)
      ? formatAdminURL({
          adminRoute,
          path: `/${collectionSlug ? `collections/${collectionSlug}` : `globals/${globalSlug}`}/${id}`,
        })
      : null

  return (
    <Tag
      className={[className, baseClass, idAsTitle && `${baseClass}--has-id`]
        .filter(Boolean)
        .join(' ')}
      data-doc-id={id}
      title={title}
    >
      {isInitializing ? (
        EmptySpace
      ) : idAsTitle ? (
        <IDLabel className={`${baseClass}__id`} id={id} />
      ) : docPath ? (
        <Link className={`${baseClass}__link`} href={docPath}>
          {title || EmptySpace}
        </Link>
      ) : (
        title || EmptySpace
      )}
    </Tag>
  )
}
