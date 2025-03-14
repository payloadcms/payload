import type {
  DefaultNodeTypes,
  DefaultTypedEditorState,
  SerializedTabNode,
  SerializedParagraphNode,
  SerializedTextNode,
  SerializedLineBreakNode,
} from '../../../nodeTypes.js'
import { convertLexicalToPlaintext } from './sync/index.js'

function textNode(text: string, bold?: boolean): SerializedTextNode {
  return {
    type: 'text',
    detail: 0,
    format: bold ? 1 : 0,
    mode: 'normal',
    style: '',
    text,
    version: 1,
  }
}

function linebreakNode(): SerializedLineBreakNode {
  return {
    type: 'linebreak',
    version: 1,
  }
}

function tabNode(): SerializedTabNode {
  return {
    type: 'tab',
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text: '',
    version: 1,
  }
}

function paragraphNode(children: DefaultNodeTypes[]): SerializedParagraphNode {
  return {
    type: 'paragraph',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

function rootNode(nodes: DefaultNodeTypes[]): DefaultTypedEditorState {
  return {
    root: {
      type: 'root',
      children: nodes,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

describe('convertLexicalToPlaintext', () => {
  it('ensure paragraph with text is correctly converted', () => {
    const data: DefaultTypedEditorState = rootNode([paragraphNode([textNode('Basic Text')])])

    const plaintext = convertLexicalToPlaintext({
      data,
    })

    console.log('plaintext', plaintext)
    expect(plaintext).toBe('Basic Text')
  })

  it('ensure paragraph with multiple text nodes is correctly converted', () => {
    const data: DefaultTypedEditorState = rootNode([
      paragraphNode([textNode('Basic Text'), textNode(' Bold', true), textNode(' Text')]),
    ])

    const plaintext = convertLexicalToPlaintext({
      data,
    })

    expect(plaintext).toBe('Basic Text Bold Text')
  })

  it('ensure linebreaks are converted correctly', () => {
    const data: DefaultTypedEditorState = rootNode([
      paragraphNode([textNode('Basic Text'), linebreakNode(), textNode('Next Line')]),
    ])

    const plaintext = convertLexicalToPlaintext({
      data,
    })

    expect(plaintext).toBe('Basic Text\nNext Line')
  })

  it('ensure tabs are converted correctly', () => {
    const data: DefaultTypedEditorState = rootNode([
      paragraphNode([textNode('Basic Text'), tabNode(), textNode('Next Line')]),
    ])

    const plaintext = convertLexicalToPlaintext({
      data,
    })

    expect(plaintext).toBe('Basic Text\tNext Line')
  })
})
