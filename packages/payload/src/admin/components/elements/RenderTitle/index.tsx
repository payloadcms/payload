import React from 'react'

import type { Props } from './types'

import useTitle from '../../../hooks/useTitle'
import IDLabel from '../IDLabel'
import './index.scss'

const baseClass = 'render-title'

const RenderTitle: React.FC<Props> = (props) => {
  const {
    className,
    collection,
    data,
    element = 'h1',
    fallback = '[untitled]',
    title: titleFromProps,
  } = props
  const titleFromForm = useTitle(collection)

  let title = titleFromForm
  if (!title) title = data?.id
  if (!title) title = fallback
  title = titleFromProps || title

  const idAsTitle = title === data?.id

  const Tag = element

  return (
    <Tag
      className={[className, baseClass, idAsTitle && `${baseClass}--is-id`]
        .filter(Boolean)
        .join(' ')}
    >
      {idAsTitle ? <IDLabel id={data?.id} /> : title}
    </Tag>
  )
}

export default RenderTitle
