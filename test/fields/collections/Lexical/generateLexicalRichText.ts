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
          version: 2,
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
                    version: 2,
                    relationTo: 'text-fields',
                    value: '{{TEXT_DOC_ID}}',
                  },
                ],
                direction: 'ltr',
              },
            },
          },
          relationTo: 'uploads',
          value: '{{UPLOAD_DOC_ID}}',
        },
        {
          format: '',
          type: 'block',
          version: 2,
          fields: {
            id: '65298b13db4ef8c744a7faaa',
            rel: '{{UPLOAD_DOC_ID}}',
            blockName: 'Block Node, with Relationship Field',
            blockType: 'relationshipBlock',
          },
        },
        {
          format: '',
          type: 'block',
          version: 2,
          fields: {
            id: '6565c8668294bf824c24d4a4',
            blockName: '',
            blockType: 'relationshipHasManyBlock',
            rel: [
              {
                value: '{{TEXT_DOC_ID}}',
                relationTo: 'text-fields',
              },
              {
                value: '{{UPLOAD_DOC_ID}}',
                relationTo: 'uploads',
              },
            ],
          },
        },
        {
          format: '',
          type: 'block',
          version: 2,
          fields: {
            id: '65298b1ddb4ef8c744a7faab',
            richTextField: {
              root: {
                type: 'root',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    format: '',
                    type: 'relationship',
                    version: 2,
                    relationTo: 'rich-text-fields',
                    value: '{{RICH_TEXT_DOC_ID}}',
                  },
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Some text below relationship node 1',
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
                ],
                direction: null,
              },
            },
            blockName: 'Block Node, with RichText Field, with Relationship Node',
            blockType: 'richTextBlock',
          },
        },
        {
          format: '',
          type: 'block',
          version: 2,
          fields: {
            id: '65298b2bdb4ef8c744a7faac',
            blockName: 'Block Node, with Blocks Field, With RichText Field, With Relationship Node',
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
                        version: 2,
                        relationTo: 'text-fields',
                        value: '{{TEXT_DOC_ID}}',
                      },
                      {
                        children: [
                          {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'Some text below relationship node 2',
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
                    ],
                    direction: null,
                  },
                },
                blockType: 'contentBlock',
              },
            ],
          },
        },
        {
          format: '',
          type: 'block',
          version: 2,
          fields: {
            id: '65298b49db4ef8c744a7faae',
            upload: '{{UPLOAD_DOC_ID}}',
            blockName: 'Block Node, With Upload Field',
            blockType: 'uploadAndRichText',
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
          format: '',
          type: 'block',
          version: 2,
          fields: {
            id: '65532e49fe515eb112e605a3',
            blockName: 'Radio Buttons 1',
            blockType: 'radioButtons',
            radioButtons: 'option1',
          },
        },
        {
          format: '',
          type: 'block',
          version: 2,
          fields: {
            id: '65532e50fe515eb112e605a4',
            blockName: 'Radio Buttons 2',
            blockType: 'radioButtons',
            radioButtons: 'option1',
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
          format: '',
          type: 'block',
          version: 2,
          fields: {
            id: '65588bfa80fb5a147a378e74',
            blockName: '',
            blockType: 'conditionalLayout',
            layout: '1',
            columns: [
              {
                id: '65588bfb80fb5a147a378e75',
                text: 'text in conditionalLayout block',
              },
            ],
          },
        }, // Do not remove this blocks node. It ensures that validation passes when it's created
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
