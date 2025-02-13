import type {
  SerializedEditorState,
  SerializedParagraphNode,
  SerializedTextNode,
} from '@payloadcms/richtext-lexical/lexical'

export function textToLexicalJSON({ text }: { text: string }): any {
  const editorJSON: SerializedEditorState = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            } as SerializedTextNode,
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          type: 'paragraph',
          textStyle: '',
          version: 1,
        } as SerializedParagraphNode,
      ],
    },
  }

  return editorJSON
}
