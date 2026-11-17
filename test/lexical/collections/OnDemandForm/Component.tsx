'use client'

import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical'
import type { JSONFieldClientProps } from 'payload'
import type React from 'react'

import { buildEditorState, RenderLexical } from '@payloadcms/richtext-lexical/client'

import { lexicalFullyFeaturedSlug } from '../../slugs.js'

export const Component: React.FC<JSONFieldClientProps> = () => {
  return (
    <div>
      Fully-Featured Component:
      <RenderLexical
        initialValue={buildEditorState<DefaultNodeTypes>({ text: 'defaultValue' })}
        name="json"
        schemaPath={`collection.${lexicalFullyFeaturedSlug}.richText`}
      />
    </div>
  )
}
