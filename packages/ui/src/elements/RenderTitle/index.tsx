'use client'
import React from 'react'

import type { Props } from './types.js'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import IDLabel from '../IDLabel/index.js'
import './index.scss'

const baseClass = 'render-title'

const RenderTitle: React.FC<Props> = (props) => {
  const { className, element = 'h1', fallback, title: titleFromProps } = props

  const documentInfo = useDocumentInfo()

  const { id, title: titleFromContext } = documentInfo

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
      {idAsTitle ? <IDLabel className={`${baseClass}__id`} id={id} /> : title}
    </Tag>
  )
}

export default RenderTitle
