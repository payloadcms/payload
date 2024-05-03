'use client'

import type { FormFieldBase } from '@payloadcms/ui/fields/shared'

import * as React from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import type { SanitizedClientEditorConfig } from '../types.js'

// Should always produce a 20 character pseudo-random string
function generateQuickGuid(): string {
  return Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12)
}
export interface EditorConfigContextType {
  editorConfig: SanitizedClientEditorConfig
  field: FormFieldBase & {
    editorConfig: SanitizedClientEditorConfig // With rendered features n stuff
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  }
  uuid: string
}

const Context: React.Context<EditorConfigContextType> = createContext({
  editorConfig: null,
  field: null,
  uuid: generateQuickGuid(),
})

export const EditorConfigProvider = ({
  children,
  editorConfig,
  fieldProps,
}: {
  children: React.ReactNode
  editorConfig: SanitizedClientEditorConfig
  fieldProps: FormFieldBase & {
    editorConfig: SanitizedClientEditorConfig // With rendered features n stuff
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  }
}): React.ReactNode => {
  // State to store the UUID
  const [uuid, setUuid] = useState(generateQuickGuid())

  // When the component mounts, generate a new UUID only once
  useEffect(() => {
    setUuid(generateQuickGuid())
  }, [])

  const editorContext = useMemo(
    () => ({ editorConfig, field: fieldProps, uuid }),
    [editorConfig, fieldProps, uuid],
  )

  return <Context.Provider value={editorContext}>{children}</Context.Provider>
}

export const useEditorConfigContext = (): EditorConfigContextType => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useEditorConfigContext must be used within an EditorConfigProvider')
  }
  return context
}
