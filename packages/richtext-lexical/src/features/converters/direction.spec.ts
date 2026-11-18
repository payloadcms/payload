import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type {
  DefaultTypedEditorState,
  LexicalElementDirection,
  SerializedHeadingNode,
  SerializedParagraphNode,
  SerializedTextNode,
} from '../../types/nodeTypes.js'

import { convertLexicalToHTMLAsync } from './lexicalToHtml/async/index.js'
import { convertLexicalToHTML } from './lexicalToHtml/sync/index.js'
import { RichText } from './lexicalToJSX/Component/index.js'

type ConvertArgs = {
  data: DefaultTypedEditorState
}

const converters: { convert: (args: ConvertArgs) => Promise<string>; name: string }[] = [
  {
    name: 'lexicalToHtml (sync)',
    convert: async (args) => convertLexicalToHTML({ ...args, disableContainer: true }),
  },
  {
    name: 'lexicalToHtml (async)',
    convert: (args) => convertLexicalToHTMLAsync({ ...args, disableContainer: true }),
  },
  {
    name: 'lexicalToJSX',
    convert: async (args) =>
      renderToStaticMarkup(createElement(RichText, { ...args, disableContainer: true })),
  },
]

describe.each(converters)('$name - text direction', ({ convert }) => {
  it.each(['ltr', 'rtl'] as const)('should render an explicit %s direction as dir', async (dir) => {
    const html = await convert({
      data: editorState({ children: [paragraphNode({ direction: dir })] }),
    })

    expect(html).toBe(`<p dir="${dir}">مرحبا</p>`)
  })

  it('should not render dir when the direction is null', async () => {
    const html = await convert({
      data: editorState({ children: [paragraphNode({ direction: null })] }),
    })

    expect(html).toBe('<p>مرحبا</p>')
  })

  it('should render dir only on the nodes that have an explicit direction', async () => {
    const html = await convert({
      data: editorState({
        children: [paragraphNode({ direction: null }), headingNode({ direction: 'rtl' })],
      }),
    })

    expect(html).toBe('<p>مرحبا</p><h2 dir="rtl">مرحبا</h2>')
  })
})

function textNode(): SerializedTextNode {
  return {
    type: 'text',
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text: 'مرحبا',
    version: 1,
  }
}

function paragraphNode({
  direction,
}: {
  direction: LexicalElementDirection
}): SerializedParagraphNode {
  return {
    type: 'paragraph',
    children: [textNode()],
    direction,
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

function headingNode({ direction }: { direction: LexicalElementDirection }): SerializedHeadingNode {
  return {
    type: 'heading',
    children: [textNode()],
    direction,
    format: '',
    indent: 0,
    tag: 'h2',
    version: 1,
  }
}

function editorState({
  children,
}: {
  children: (SerializedHeadingNode | SerializedParagraphNode)[]
}): DefaultTypedEditorState {
  return {
    root: {
      type: 'root',
      children,
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
