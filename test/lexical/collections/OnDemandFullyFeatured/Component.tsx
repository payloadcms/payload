'use client'

import type { JSONFieldClientComponent } from 'payload'

import { buildEditorState, useRenderEditor_internal_ } from '@payloadcms/richtext-lexical/client'
import { useEffect, useRef } from 'react'

import { lexicalFullyFeaturedSlug } from '../../slugs.js'

export const Component: JSONFieldClientComponent = (args) => {
  const { Component, renderLexical } = useRenderEditor_internal_({
    name: 'richText2',
    editorTarget: `collections.${lexicalFullyFeaturedSlug}.richText`,
  })
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) {
      return
    }
    void renderLexical({
      initialValue: buildEditorState({ text: 'defaultValue' }),
    })
    mounted.current = true
  }, [renderLexical])
  return <div>Fully-Featured Component: {Component ? <Component /> : 'Loading...'}</div>
}
