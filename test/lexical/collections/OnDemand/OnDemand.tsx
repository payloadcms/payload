'use client'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import type { JSONFieldClientComponent } from 'payload'

import { buildEditorState, useRenderEditor_internal_ } from '@payloadcms/richtext-lexical/client'
import { use, useCallback, useEffect, useRef, useState } from 'react'

export const OnDemand: JSONFieldClientComponent = (args) => {
  const { Component, renderLexical } = useRenderEditor_internal_({
    name: 'richText',
    editorTarget: 'default',
  })

  // mount the lexical runtime once
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) {
      return
    }
    void renderLexical()
    mounted.current = true
  }, [renderLexical])

  // build the initial editor state once, with lazy init (no ref reads in render)
  const [initialValue] = useState<DefaultTypedEditorState | undefined>(() =>
    buildEditorState({ text: 'state default' }),
  )

  // keep latest content in a ref so updates don’t trigger React renders
  const latestValueRef = useRef<DefaultTypedEditorState | undefined>(initialValue)

  // stable setter given to the editor; updates ref only
  const setValueStable = useCallback((next: DefaultTypedEditorState | undefined) => {
    // absolutely no state set here; no React re-render, no remount
    latestValueRef.current = next
    // if you later get access to the editor instance, this is where you'd imperatively sync it
  }, [])

  // If you need a "reset to default," and the editor doesn't expose an imperative API,
  // the only reliable way is a key bump to force a remount ON RESET ONLY.
  // This does not affect normal setValue cycles.
  const [resetNonce, setResetNonce] = useState(0)
  const handleReset = useCallback(() => {
    latestValueRef.current = initialValue
    // If you have an imperative API: editor.setEditorState(initialValue)
    // Otherwise, remount once to guarantee visual reset:
    setResetNonce((n) => n + 1)
  }, [initialValue])

  return (
    <div>
      <div>Default Component:</div>
      {Component ? (
        <Component
          key={resetNonce}
          // editor will call this; we won't re-render on its calls
          setValue={setValueStable as any}
          // initial value only; never changes so the element won’t re-render because of this prop
          value={initialValue}
        />
      ) : (
        'Loading...'
      )}

      <button onClick={handleReset} style={{ marginTop: 8 }} type="button">
        Reset to Default
      </button>
    </div>
  )
}
