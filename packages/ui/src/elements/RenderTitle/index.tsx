'use client'
import React from 'react'

import type { Props } from './types'

import IDLabel from '../IDLabel'
import { useDocumentInfo } from '../../providers/DocumentInfo'
import './index.scss'

const baseClass = 'render-title'

const RenderTitle: React.FC<Props> = (props) => {
  const { className, element = 'h1', title: titleFromProps } = props

  const { title: titleFromContext, id } = useDocumentInfo()

  const title = titleFromProps || titleFromContext

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
