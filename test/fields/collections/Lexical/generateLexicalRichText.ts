export function generateLexicalRichText() {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          format: '',
          type: 'block',
          version: 1,
          fields: {
            data: {
              id: '65298129c06820f57f482ab8',
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
              blockName: 'blocky',
              blockType: 'richText',
            },
          },
        },
      ],
      direction: null,
    },
  }
}
