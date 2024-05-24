'use client'
import React, { Fragment } from 'react'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { IDLabel } from '../IDLabel/index.js'
import './index.scss'

const baseClass = 'render-title'

export type RenderTitleProps = {
  className?: string
  element?: React.ElementType
  fallback?: string
  fallbackToID?: boolean
  title?: string
}

export const RenderTitle: React.FC<RenderTitleProps> = (props) => {
  const { className, element = 'h1', fallback, title: titleFromProps } = props

  const { id, isInitializing, title: titleFromContext } = useDocumentInfo()

  const title = titleFromProps || titleFromContext || fallback

  const idAsTitle = title === id

  const Tag = element

  // Render and invisible character to prevent layout shift when the title populates from context
  const EmptySpace = <Fragment>&nbsp;</Fragment>

  return (
    <Tag
      className={[className, baseClass, idAsTitle && `${baseClass}--has-id`]
        .filter(Boolean)
        .join(' ')}
      title={title}
    >
      {isInitializing ? (
        EmptySpace
      ) : (
        <Fragment>
          {idAsTitle ? <IDLabel className={`${baseClass}__id`} id={id} /> : title || EmptySpace}
        </Fragment>
      )}
    </Tag>
  )
}
