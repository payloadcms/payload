import type { SerializedEditorState, SerializedParagraphNode, SerializedTextNode } from 'lexical'

export const defaultRichTextValue: SerializedEditorState = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '',
            version: 1,
          } as SerializedTextNode,
        ],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        version: 1,
      } as SerializedParagraphNode,
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
}
