'use client'

import React, { useCallback, useId, useLayoutEffect, useState } from 'react'

type PersistentTemplateRecord = {
  content: React.ReactNode
  id: string
}

type PersistentTemplateContextType = {
  isActive: boolean
  register: (id: string, content: React.ReactNode) => void
  unregister: (id: string) => void
}

const PersistentTemplateContext = React.createContext<null | PersistentTemplateContextType>(null)

export const PersistentTemplateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [template, setTemplate] = useState<null | PersistentTemplateRecord>(null)

  const register = useCallback((id: string, content: React.ReactNode) => {
    setTemplate({ id, content })
  }, [])

  const unregister = useCallback((id: string) => {
    setTemplate((current) => (current?.id === id ? null : current))
  }, [])

  return (
    <PersistentTemplateContext value={{ isActive: template !== null, register, unregister }}>
      {children}
      {template?.content}
    </PersistentTemplateContext>
  )
}

export const PersistentTemplateRegistration: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const context = React.use(PersistentTemplateContext)
  const id = useId()

  if (!context) {
    throw new Error('PersistentTemplateRegistration must be used within PersistentTemplateProvider')
  }

  const { isActive, register, unregister } = context

  useLayoutEffect(() => {
    register(id, children)

    return () => {
      unregister(id)
    }
  }, [children, id, register, unregister])

  return isActive ? null : children
}
