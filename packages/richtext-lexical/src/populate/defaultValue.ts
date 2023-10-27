import type { SerializedEditorState, SerializedParagraphNode, SerializedTextNode } from 'lexical'

export const defaultRichTextValue: SerializedEditorState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '',
            type: 'text',
            version: 1,
          } as SerializedTextNode,
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      } as SerializedParagraphNode,
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
}

export const defaultRichTextValueV2: SerializedEditorState = {
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      } as SerializedParagraphNode,
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
}
