'use client'
import type { Element } from 'slate'

import React from 'react'

import type { LoadedSlateFieldProps } from '../types.js'

type ElementContextType<T> = {
  attributes: Record<string, unknown>
  children: React.ReactNode
  editorRef: React.RefObject<HTMLDivElement>
  element: T
  fieldProps: LoadedSlateFieldProps
  path: string
  schemaPath: string
}

const ElementContext = React.createContext<ElementContextType<Element>>({
  attributes: {},
  children: null,
  editorRef: null,
  element: {} as Element,
  fieldProps: {} as any,
  path: '',
  schemaPath: '',
})

export const ElementProvider: React.FC<
  {
    childNodes: React.ReactNode
  } & ElementContextType<Element>
> = (props) => {
  const { childNodes, children, ...rest } = props

  return (
    <ElementContext
      value={{
        ...rest,
        children: childNodes,
      }}
    >
      {children}
    </ElementContext>
  )
}

export const useElement = <T,>(): ElementContextType<T> => {
  return React.use(ElementContext) as ElementContextType<T>
}
