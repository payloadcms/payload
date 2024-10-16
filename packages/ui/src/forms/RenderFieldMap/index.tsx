'use client'

import type { FieldRow } from 'payload'

import React, { useCallback } from 'react'

import type { Props } from './types.js'

import { useIntersect } from '../../hooks/useIntersect.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'render-fields'

export { Props }

export const RenderFieldMap: React.FC<Props> = (props) => {
  const { className, forceRender, margins, renderedFieldMap } = props

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
        {hasRendered &&
          renderedFields?.map(({ Field, renderedRows }, index) => (
            <FieldRowsProvider key={index} renderedRows={renderedRows}>
              {Field}
            </FieldRowsProvider>
          ))}
      </div>
    )
  }

  return null
}

const FieldRowsContext = React.createContext<{
  renderedRows: FieldRow[]
  setRenderedRow: (args: { renderedRow: FieldRow; rowIndex: number }) => void
}>(undefined)

export const FieldRowsProvider: React.FC<{
  children: React.ReactNode
  renderedRows: FieldRow[]
}> = ({ children, renderedRows: initialRows }) => {
  const [renderedRows, setRenderedRowsToState] = React.useState(initialRows)

  const setRenderedRow = useCallback(
    (args: { renderedRow: FieldRow; rowIndex: number }) => {
      const { renderedRow: incomingRow, rowIndex } = args

      const withUpdatedRow = [...renderedRows]

      console.log('setting into renderedRows', { incomingRow, rowIndex })
      // splice it in, if it doesn't exist, otherwise add it
      if (withUpdatedRow[rowIndex]) {
        withUpdatedRow.splice(rowIndex, 1, incomingRow)
      } else {
        withUpdatedRow.push(incomingRow)
      }

      console.log('result, ', withUpdatedRow)
      setRenderedRowsToState(withUpdatedRow)
    },
    [renderedRows],
  )

  return (
    <FieldRowsContext.Provider value={{ renderedRows, setRenderedRow }}>
      {children}
    </FieldRowsContext.Provider>
  )
}

export const useFieldRows = () => {
  const context = React.useContext(FieldRowsContext)

  if (context === undefined) {
    throw new Error('useFieldRows must be used within a FieldRowsProvider')
  }

  return context
}
