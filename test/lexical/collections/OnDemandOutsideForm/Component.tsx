'use client'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import type { JSONFieldClientComponent } from 'payload'

import { buildEditorState, RenderLexical } from '@payloadcms/richtext-lexical/client'
import React, { useState } from 'react'

import { lexicalFullyFeaturedSlug } from '../../slugs.js'

export const Component: JSONFieldClientComponent = (args) => {
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
        field={{ name: 'json' }}
        initialValue={buildEditorState({ text: 'defaultValue' })}
        schemaPath={`collection.${lexicalFullyFeaturedSlug}.richText`}
        setValue={setValue as any}
        value={value}
      />
      <button onClick={handleReset} style={{ marginTop: 8 }} type="button">
        Reset Editor State
      </button>
    </div>
  )
}
