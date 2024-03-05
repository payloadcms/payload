'use client'
import React from 'react'

import type { Props } from './types'

import { useIntersect } from '../../hooks/useIntersect'
import { useTranslation } from '../../providers/Translation'
import { RenderField } from './RenderField'
import './index.scss'

const baseClass = 'render-fields'

const RenderFields: React.FC<Props> = (props) => {
  const { className, fieldMap, forceRender, margins } = props

  const { i18n } = useTranslation()
  const [hasRendered, setHasRendered] = React.useState(Boolean(forceRender))
  const [intersectionRef, entry] = useIntersect(
    {
      rootMargin: '1000px',
    },
    forceRender,
  )
  const isIntersecting = Boolean(entry?.isIntersecting)
  const isAboveViewport = entry?.boundingClientRect?.top < 0
  const shouldRender = forceRender || isIntersecting || isAboveViewport

  React.useEffect(() => {
    if (shouldRender && !hasRendered) {
      setHasRendered(true)
    }
  }, [shouldRender, hasRendered])

  if (!fieldMap || (Array.isArray(fieldMap) && fieldMap.length === 0)) {
    console.error('No fieldMap provided when calling RenderFields')
  }

  if (!i18n) {
    console.error('Need to implement i18n when calling RenderFields')
  }

  if (fieldMap) {
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
          fieldMap?.map(({ name, Field, fieldPermissions, readOnly }, fieldIndex) => (
            <RenderField
              Field={Field}
              fieldPermissions={fieldPermissions}
              key={fieldIndex}
              name={name}
              readOnly={readOnly}
            />
          ))}
      </div>
    )
  }

  return null
}

export default RenderFields
