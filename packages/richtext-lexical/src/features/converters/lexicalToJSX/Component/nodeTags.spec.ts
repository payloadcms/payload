import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { DefaultTypedEditorState, SerializedTextNode } from '../../../../types/nodeTypes.js'

import { RichText } from './index.js'

const text = 'body { display: none; }'
const textNode: SerializedTextNode = {
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  version: 1,
}

describe('RichText node tags', () => {
  it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])(
    'should preserve the allowed heading tag %s',
    (tag) => {
      const html = renderToStaticMarkup(
        createElement(RichText, {
          data: createEditorState({ tag, type: 'heading' }),
          disableContainer: true,
        }),
      )

      expect(html).toBe(`<${tag}>${text}</${tag}>`)
    },
  )

  it.each([
    { listType: 'bullet', tag: 'ul' },
    { listType: 'number', tag: 'ol' },
    { listType: 'check', tag: 'ul' },
  ])('should preserve the allowed $listType list tag $tag', ({ listType, tag }) => {
    const html = renderToStaticMarkup(
      createElement(RichText, {
        data: createEditorState({ listType, tag, type: 'list' }),
        disableContainer: true,
      }),
    )

    expect(html).toBe(`<${tag} class="list-${listType}">${text}</${tag}>`)
  })

  describe.each(['heading', 'list'] as const)('%s', (type) => {
    it.each(
      [
        'style',
        'script',
        'plaintext',
        'iframe',
        'div',
        'h7',
        '',
        null,
        undefined,
        1,
        {},
        ['h1'],
      ].map((tag) => ({ tag })),
    )('should replace an invalid tag $tag with a safe fallback', ({ tag }) => {
      const html = renderToStaticMarkup(
        createElement(RichText, { data: createEditorState({ tag, type }), disableContainer: true }),
      )

      expect(html).toBe(
        type === 'heading' ? `<h1>${text}</h1>` : `<ul class="list-bullet">${text}</ul>`,
      )
    })

    it('should replace invalid tags in nested nodes', () => {
      const data = createEditorState({ tag: 'style', type })

      data.root.children = [
        {
          type: 'quote',
          children: data.root.children,
          direction: null,
          format: '',
          indent: 0,
          version: 1,
        },
      ]

      const html = renderToStaticMarkup(createElement(RichText, { data, disableContainer: true }))

      expect(html).toBe(
        `<blockquote>${type === 'heading' ? `<h1>${text}</h1>` : `<ul class="list-bullet">${text}</ul>`}</blockquote>`,
      )
    })
  })
})

function createEditorState({
  listType = 'bullet',
  tag,
  type,
}: {
  listType?: string
  tag: unknown
  type: 'heading' | 'list'
}): DefaultTypedEditorState {
  // Stored JSON can contain values outside the serialized node's TypeScript types.
  return {
    root: {
      type: 'root',
      children: [
        {
          type,
          children: [textNode],
          direction: null,
          format: '',
          indent: 0,
          ...(type === 'list' ? { listType, start: 1 } : {}),
          tag,
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  } as DefaultTypedEditorState
}
