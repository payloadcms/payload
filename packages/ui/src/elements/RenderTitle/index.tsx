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
  focusFieldOnPlaceholder?: string
  /**
   * When true, renders the title as a link to the document. Useful inside drawers
   * to navigate to the full document view.
   */
  renderAsLink?: boolean
  title?: string
}

export const RenderTitle: React.FC<RenderTitleProps> = (props) => {
  const {
    className,
    element = 'h1',
    fallback,
    focusFieldOnPlaceholder,
    renderAsLink,
    title: titleFromProps,
  } = props

  const { id, collectionSlug, globalSlug, isInitializing } = useDocumentInfo()
  const { isPlaceholder, title: titleFromContext } = useDocumentTitle()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const title = titleFromProps || titleFromContext || fallback

  const idAsTitle = title === id

  const showPlaceholder = !titleFromProps && isPlaceholder

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
      className={[
        className,
        baseClass,
        idAsTitle && `${baseClass}--has-id`,
        showPlaceholder && `${baseClass}--placeholder`,
      ]
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
      ) : showPlaceholder && focusFieldOnPlaceholder && focusFieldOnPlaceholder !== 'id' ? (
        <button
          className={`${baseClass}__placeholder-button`}
          onClick={(event) => {
            const fieldID = `field-${focusFieldOnPlaceholder.replace(/\./g, '__')}`
            const scope = event.currentTarget.closest('.template-default__wrap')
            const field = scope?.querySelector<HTMLElement>(`#${CSS.escape(fieldID)}`)
            const input =
              field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
                ? field
                : field?.querySelector<HTMLElement>(
                    'input:not([type="hidden"]), textarea, [contenteditable="true"], [role="combobox"], button',
                  )

            input?.focus()
          }}
          type="button"
        >
          {title || EmptySpace}
        </button>
      ) : (
        title || EmptySpace
      )}
    </Tag>
  )
}
