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

  const documentInfo = useDocumentInfo()

  const { id, isInitializing, title: titleFromContext } = documentInfo

  const title = titleFromProps || titleFromContext || fallback

  const idAsTitle = title === id

  const Tag = element

  return (
    <Tag
      className={[className, baseClass, idAsTitle && `${baseClass}--has-id`]
        .filter(Boolean)
        .join(' ')}
      title={title}
    >
      {isInitializing ? null : (
        <Fragment>
          {idAsTitle ? <IDLabel className={`${baseClass}__id`} id={id} /> : title || null}
        </Fragment>
      )}
    </Tag>
  )
}
