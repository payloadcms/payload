export function generateLexicalRichText() {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Upload Node:',
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
        {
          format: '',
          type: 'upload',
          version: 1,
          fields: {
            caption: {
              root: {
                type: 'root',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Relationship inside Upload Caption:',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                  {
                    format: '',
                    type: 'relationship',
                    version: 1,
                    relationTo: 'text-fields',
                    value: {
                      id: '{{TEXT_DOC_ID}}',
                    },
                  },
                ],
                direction: 'ltr',
              },
            },
          },
          relationTo: 'uploads',
          value: {
            id: '{{UPLOAD_DOC_ID}}',
          },
        },
        {
          format: '',
          type: 'block',
          version: 1,
          fields: {
            data: {
              id: '65298b13db4ef8c744a7faaa',
              rel: '{{UPLOAD_DOC_ID}}',
              blockName: 'Block Node, with Relationship Field',
              blockType: 'relationshipBlock',
            },
          },
        },
        {
          format: '',
          type: 'block',
          version: 1,
          fields: {
            data: {
              id: '65298b1ddb4ef8c744a7faab',
              richText: {
                root: {
                  type: 'root',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      format: '',
                      type: 'relationship',
                      version: 1,
                      relationTo: 'rich-text-fields',
                      value: {
                        id: '{{RICH_TEXT_DOC_ID}}',
                      },
                    },
                  ],
                  direction: null,
                },
              },
              blockName: 'Block Node, with RichText Field, with Relationship Node',
              blockType: 'richText',
            },
          },
        },
        {
          format: '',
          type: 'block',
          version: 1,
          fields: {
            data: {
              id: '65298b2bdb4ef8c744a7faac',
              blockName:
                'Block Node, with Blocks Field, With RichText Field, With Relationship Node',
              blockType: 'subBlock',
              subBlocks: [
                {
                  id: '65298b2edb4ef8c744a7faad',
                  richText: {
                    root: {
                      type: 'root',
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          format: '',
                          type: 'relationship',
                          version: 1,
                          relationTo: 'text-fields',
                          value: {
                            id: '{{TEXT_DOC_ID}}',
                          },
                        },
                      ],
                      direction: null,
                    },
                  },
                  blockType: 'contentBlock',
                },
              ],
            },
          },
        },
        {
          format: '',
          type: 'block',
          version: 1,
          fields: {
            data: {
              id: '65298b49db4ef8c744a7faae',
              upload: '{{UPLOAD_DOC_ID}}',
              blockName: 'Block Node, With Upload Field',
              blockType: 'uploadAndRichText',
            },
          },
        },
        {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
        {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
    },
  }
}
