'use client'
import React, { useEffect } from 'react'

import type { Props } from './types.js'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import IDLabel from '../IDLabel/index.js'
import './index.scss'

const baseClass = 'render-title'

export const RenderTitle: React.FC<Props> = (props) => {
  const { className, element = 'h1', fallback, onChange, title: titleFromProps } = props

  const documentInfo = useDocumentInfo()

  const { id, title: titleFromContext } = documentInfo

  const title = titleFromProps || titleFromContext || fallback

  const idAsTitle = title === id

  const Tag = element

  useEffect(() => {
    if (typeof onChange === 'function') {
      onChange(title)
    }
  }, [onChange, title])

  return (
    <Tag
      className={[className, baseClass, idAsTitle && `${baseClass}--has-id`]
        .filter(Boolean)
        .join(' ')}
      title={title}
    >
      {idAsTitle ? <IDLabel className={`${baseClass}__id`} id={id} /> : title || null}
    </Tag>
  )
}
