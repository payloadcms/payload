'use client'
import React from 'react'

import type { Props } from './types.js'

import { useIntersect } from '../../hooks/useIntersect.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { RenderField } from './RenderField.js'
import './index.scss'

const baseClass = 'render-fields'

export { Props }

export const RenderFields: React.FC<Props> = (props) => {
  const { className, fields, forceRender, indexPath, margins, path, permissions, schemaPath } =
    props

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

  if (!fields || (Array.isArray(fields) && fields.length === 0)) {
    return null
  }

  if (!i18n) {
    console.error('Need to implement i18n when calling RenderFields') // eslint-disable-line no-console
  }

  if (fields) {
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
        {hasRendered &&
          fields?.map((field, fieldIndex) => {
            const forceRenderChildren =
              (typeof forceRender === 'number' && fieldIndex <= forceRender) || true

            const name = 'name' in field ? field.name : undefined

            return (
              <RenderField
                fieldComponentProps={{ field, forceRender: forceRenderChildren }}
                indexPath={indexPath !== undefined ? `${indexPath}.${fieldIndex}` : `${fieldIndex}`}
                key={fieldIndex}
                name={name}
                path={path}
                permissions={permissions?.[name]}
                schemaPath={schemaPath}
                siblingPermissions={permissions}
              />
            )
          })}
      </div>
    )
  }

  return null
}
