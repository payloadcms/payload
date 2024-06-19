'use client'
import type { FormFieldBase } from '@payloadcms/ui'
import type { Element } from 'slate'

import React from 'react'

type ElementContextType<T> = {
  attributes: Record<string, unknown>
  children: React.ReactNode
  editorRef: React.MutableRefObject<HTMLDivElement>
  element: T
  fieldProps: FormFieldBase & {
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  }
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
  ElementContextType<Element> & {
    childNodes: React.ReactNode
  }
> = (props) => {
  const { childNodes, children, ...rest } = props

  return (
    <ElementContext.Provider
      value={{
        ...rest,
        children: childNodes,
      }}
    >
      {children}
    </ElementContext.Provider>
  )
}

export const useElement = <T,>(): ElementContextType<T> => {
  return React.useContext(ElementContext) as ElementContextType<T>
}
