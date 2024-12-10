import type { SerializedRelationshipNode } from '@payloadcms/richtext-lexical'
import type {
  SerializedEditorState,
  SerializedParagraphNode,
  SerializedTextNode,
} from '@payloadcms/richtext-lexical/lexical'

import { lexicalLocalizedFieldsSlug } from '../../slugs.js'

export function textToLexicalJSON({
  text,
  lexicalLocalizedRelID,
}: {
  lexicalLocalizedRelID?: number | string
  text: string
}): any {
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

  if (lexicalLocalizedRelID) {
    editorJSON.root.children.push({
      format: '',
      type: 'relationship',
      version: 2,
      relationTo: lexicalLocalizedFieldsSlug,
      value: lexicalLocalizedRelID,
    } as SerializedRelationshipNode)
  }

  return editorJSON
}
