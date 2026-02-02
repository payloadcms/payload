'use client'
import type { LexicalEditorViewMap } from '@payloadcms/richtext-lexical'

// Do not change this - needs to only have one frontend view
export const lexicalViews: LexicalEditorViewMap<LexicalViewsNodes> = {
  frontend: {
    nodes: {
      heading: {
        html: ({ node }) => {
          return `<h1>test</h1>`
        },
      },
      quote: {
        Component: ({ node }) => {
          return <blockquote>ooo</blockquote>
        },
        createDOM: ({ node }) => {
          const q = document.createElement('blockquote')
          q.innerHTML = '<blockquote>test</blockquote>'
          return q
        },
        html: ({ node }) => {
          return '<blockquote>test</blockquote>'
        },
      },
    },
  },
}
