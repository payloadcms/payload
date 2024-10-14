'use client'

import type { RenderedFieldMap } from 'payload'

import React, { useCallback } from 'react'

import type { Props } from './types.js'

import { useIntersect } from '../../hooks/useIntersect.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'render-fields'

export { Props }

const RenderFields: React.FC<Omit<Props, 'renderedFieldMap'>> = (props) => {
  const { className, forceRender, margins } = props

  const { renderedFieldMap } = useRenderedFieldMap()

  const renderedFields = Array.from(renderedFieldMap.values())

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

  if (!renderedFields || (Array.isArray(renderedFields) && renderedFields.length === 0)) {
    return null
  }

  if (!i18n) {
    console.error('Need to implement i18n when calling RenderFields') // eslint-disable-line no-console
  }

  if (renderedFields) {
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
        {hasRendered && renderedFields?.map(({ Field }) => Field)}
      </div>
    )
  }

  return null
}

export const RenderFieldMap: React.FC<Props> = ({ renderedFieldMap, ...rest }) => {
  return (
    <RenderedFieldProvider renderedFieldMap={renderedFieldMap}>
      <RenderFields {...rest} />
    </RenderedFieldProvider>
  )
}

const RenderedFieldContext = React.createContext<{
  renderedFieldMap: RenderedFieldMap
  setRenderedFieldMap: React.Dispatch<React.SetStateAction<RenderedFieldMap>> | undefined
  setRenderedFieldMapByPath: (args: {
    path: string
    renderedFieldMap: RenderedFieldMap
    rowIndex: number
  }) => void
}>(undefined)

export const RenderedFieldProvider: React.FC<{
  children: React.ReactNode
  renderedFieldMap: RenderedFieldMap
}> = ({ children, renderedFieldMap: initialFieldMap }) => {
  const [renderedFieldMap, setRenderedFieldMap] = React.useState(initialFieldMap)

  const setRenderedFieldMapByPath = useCallback(
    (args: { path: string; renderedFieldMap: RenderedFieldMap; rowIndex: number }) => {
      const { path, renderedFieldMap: incomingFieldMap, rowIndex } = args

      const pathWithChanges = renderedFieldMap.get(path)

      // iterate over the incomingFieldMap and set each file onto the withChanges map, prepending the path onto the key
      incomingFieldMap.forEach((field, key) => {
        pathWithChanges?.renderedFieldMap?.set(`${path}.${rowIndex}.${key}`, field)
      })

      const newRenderedFieldMap = new Map(renderedFieldMap)

      newRenderedFieldMap.set(path, pathWithChanges)
    },
    [renderedFieldMap],
  )

  return (
    <RenderedFieldContext.Provider
      value={{ renderedFieldMap, setRenderedFieldMap, setRenderedFieldMapByPath }}
    >
      {children}
    </RenderedFieldContext.Provider>
  )
}

export const useRenderedFieldMap = () => {
  const context = React.useContext(RenderedFieldContext)

  if (context === undefined) {
    throw new Error('useRenderedFieldMap must be used within a RenderedFieldProvider')
  }

  return context
}
