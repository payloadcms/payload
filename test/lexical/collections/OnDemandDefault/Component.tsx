'use client'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import type { JSONFieldClientComponent } from 'payload'

import { buildEditorState, useRenderEditor_internal_ } from '@payloadcms/richtext-lexical/client'
import React, { useEffect, useRef, useState } from 'react'

export const Component: JSONFieldClientComponent = (args) => {
  const { Component, renderLexical } = useRenderEditor_internal_({
    name: 'richText',
    editorTarget: 'default',
  })
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) {
      return
    }
    void renderLexical()
    mounted.current = true
  }, [renderLexical])

  const [value, setValue] = useState<DefaultTypedEditorState | undefined>(() =>
    buildEditorState({ text: 'state default' }),
  )

  const handleReset = React.useCallback(() => {
    setValue(buildEditorState({ text: 'state default' }))
  }, [])

  return (
    <div>
      Default Component:
      {Component ? <Component setValue={setValue as any} value={value} /> : 'Loading...'}
      <button onClick={handleReset} style={{ marginTop: 8 }} type="button">
        Reset Editor State
      </button>
    </div>
  )
}
