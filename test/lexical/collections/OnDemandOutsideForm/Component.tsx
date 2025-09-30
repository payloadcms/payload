'use client'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import type { JSONFieldClientComponent } from 'payload'

import { buildEditorState, RenderLexical } from '@payloadcms/richtext-lexical/client'
import React, { useState } from 'react'

export const Component: JSONFieldClientComponent = () => {
  const [value, setValue] = useState<DefaultTypedEditorState | undefined>(() =>
    buildEditorState({ text: 'state default' }),
  )

  const handleReset = React.useCallback(() => {
    setValue(buildEditorState({ text: 'state default' }))
  }, [])

  return (
    <div>
      Default Component:
      <RenderLexical
        field={{ name: 'myField', label: 'My Label' }}
        initialValue={buildEditorState({ text: 'defaultValue' })}
        schemaPath={`collection.OnDemandOutsideForm.hiddenAnchor`}
        setValue={setValue as any}
        value={value}
      />
      <button onClick={handleReset} style={{ marginTop: 8 }} type="button">
        Reset Editor State
      </button>
    </div>
  )
}
