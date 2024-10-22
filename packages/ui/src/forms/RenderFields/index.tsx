'use client'

import { generatePath } from 'payload/shared'
import React, { Fragment } from 'react'

import type { Props } from './types.js'

import { useIntersect } from '../../hooks/useIntersect.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useFieldSlots } from '../Form/context.js'
import './index.scss'

const baseClass = 'render-fields'

export { Props }

export const RenderFields: React.FC<Props> = (props) => {
  const { className, fields, forceRender, margins, path: parentPath } = props

  const { fieldSlots } = useFieldSlots()

  const { i18n } = useTranslation()

  const [hasRendered, setHasRendered] = React.useState(Boolean(forceRender))

  const [intersectionRef, entry] = useIntersect(
    {
      rootMargin: '1000px',
    },
    Boolean(forceRender),
  )

  const isIntersecting = Boolean(entry?.isIntersecting)
  const isAboveViewport = entry?.boundingClientRect?.top < 0
  const shouldRender = forceRender || isIntersecting || isAboveViewport

  React.useEffect(() => {
    if (shouldRender && !hasRendered) {
      setHasRendered(true)
    }
  }, [shouldRender, hasRendered])

  if (!fieldSlots || fieldSlots.size === 0) {
    return <p>No fields to render</p>
  }

  if (!i18n) {
    console.error('Need to implement i18n when calling RenderFields') // eslint-disable-line no-console
  }

  if (fields && fields.length > 0) {
    return (
      <div
        className={[
          baseClass,
          className,
          margins && `${baseClass}--margins-${margins}`,
          margins === false && `${baseClass}--margins-none`,
        ]
          .filter(Boolean)
          .join(' ')}
        ref={intersectionRef}
      >
        {fields.map((field, i) => {
          const path = generatePath({
            name: 'name' in field ? field.name : undefined,
            fieldType: field.type,
            parentPath,
            schemaIndex: i,
          })

          const Field = fieldSlots.get(path)?.Field

          return (
            <Fragment key={i}>
              <p>{`path: ${path}`}</p>
              <p>{JSON.stringify(field._schemaAccessor, null, 2)}</p>
              {Field}
            </Fragment>
          )
        })}
      </div>
    )
  }

  return null
}
