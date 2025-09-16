'use client'

import type { JSONFieldClientComponent } from 'payload'

import { buildEditorState, RenderLexical } from '@payloadcms/richtext-lexical/client'

import { lexicalFullyFeaturedSlug } from '../../slugs.js'

export const Component: JSONFieldClientComponent = () => {
  return (
    <div>
      Fully-Featured Component:
      <RenderLexical
        field={{ name: 'json' }}
        initialValue={buildEditorState({ text: 'defaultValue' })}
        schemaPath={`collection.${lexicalFullyFeaturedSlug}.richText`}
      />
    </div>
  )
}
