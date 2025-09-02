'use client'

import type { JSONFieldClientComponent } from 'payload'

import { buildEditorState, useRenderEditor_internal_ } from '@payloadcms/richtext-lexical/client'
import { useEffect, useRef } from 'react'

import { lexicalFullyFeaturedSlug } from '../../../lexical/slugs.js'

export const OnDemand: JSONFieldClientComponent = (args) => {
  const { Component, renderLexical } = useRenderEditor_internal_({
    name: 'richText2',
    editorTarget: `collections.${lexicalFullyFeaturedSlug}.richText`,
    initialValue: buildEditorState({ text: 'defaultValue' }),
  })
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) {
      return
    }
    void renderLexical()
    mounted.current = true
  }, [renderLexical])
  return <div>Fully-Featured Component: {Component ? <Component /> : 'Loading...'}</div>
}
