'use client'

import { useRenderEditor_internal_ } from '@payloadcms/richtext-lexical/client'
import { useEffect, useRef } from 'react'

import { lexicalFullyFeaturedSlug } from '../../../lexical/slugs.js'

export const OnDemand: React.FC = () => {
  const { Component, renderLexical } = useRenderEditor_internal_({
    name: 'richText',
    editorTarget: `collections.${lexicalFullyFeaturedSlug}.richText`,
    initialState: {} as any,
  })
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) {
      return
    }
    void renderLexical()
    mounted.current = true
  }, [renderLexical])
  return <div>Component: {Component ? Component : 'Loading...'}</div>
}
