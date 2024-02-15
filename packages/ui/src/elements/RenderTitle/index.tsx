'use client'
import React from 'react'

import type { Props } from './types'

import useTitle from '../../hooks/useTitle'
import IDLabel from '../IDLabel'
import { useDocumentInfo } from '../../providers/DocumentInfo'
import './index.scss'

const baseClass = 'render-title'

const RenderTitle: React.FC<Props> = (props) => {
  const {
    className,
    useAsTitle,
    globalLabel,
    globalSlug,
    element = 'h1',
    fallback = '[untitled]',
    title: titleFromProps,
  } = props

  const { id } = useDocumentInfo()

  const titleFromForm = useTitle({
    useAsTitle: useAsTitle,
    globalLabel: globalLabel,
    globalSlug: globalSlug,
  })

  let title = titleFromForm
  if (!title) title = id?.toString()
  if (!title) title = fallback
  title = titleFromProps || title

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
