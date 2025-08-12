import type { Test } from '../int.spec.js'

import { tableJson } from '../tableJson.js'
import { textToRichText } from '../textToRichText.js'

export const defaultTests: Test[] = [
  {
    inputAfterConvertFromEditorJSON: `<PackageInstallOptions packageId="444" uniqueId="xxx" update/>`,
    input: `
<PackageInstallOptions
  packageId="444"
  uniqueId="xxx" update/>
      `,
    blockNode: {
      fields: {
        blockType: 'PackageInstallOptions',
        packageId: '444',
        update: true,
        uniqueId: 'xxx',
      },
    },
  },
  {
    // Same test but with single quote property values
    inputAfterConvertFromEditorJSON: `<PackageInstallOptions packageId="444" uniqueId="xxx" update/>`,
    input: `
<PackageInstallOptions
  packageId='444'
  uniqueId='xxx' update/>
      `,
    blockNode: {
      fields: {
        blockType: 'PackageInstallOptions',
        packageId: '444',
        update: true,
        uniqueId: 'xxx',
      },
    },
  },
  {
    input: `
<PackageInstallOptions packageId="444">
  ignored
</PackageInstallOptions>
`,
    inputAfterConvertFromEditorJSON: `<PackageInstallOptions packageId="444"/>`,
    blockNode: {
      fields: {
        blockType: 'PackageInstallOptions',
        packageId: '444',
      },
    },
  },
  {
    input: `
<PackageInstallOptions update packageId="444">
  ignored
</PackageInstallOptions>
`,
    inputAfterConvertFromEditorJSON: `<PackageInstallOptions packageId="444" update/>`,
    blockNode: {
      fields: {
        blockType: 'PackageInstallOptions',
        packageId: '444',
        update: true,
      },
    },
  },
  {
    input: `
<PackageInstallOptions
  update
  packageId="444">
  ignored
</PackageInstallOptions>
`,
    inputAfterConvertFromEditorJSON: `<PackageInstallOptions packageId="444" update/>`,
    blockNode: {
      fields: {
        blockType: 'PackageInstallOptions',
        packageId: '444',
        update: true,
      },
    },
  },
  {
    inputAfterConvertFromEditorJSON: `<PackageInstallOptions packageId="444" update/>`,
    input: `
<PackageInstallOptions
  update
  packageId="444"
>
  ignored
</PackageInstallOptions>
`,
    blockNode: {
      fields: {
        blockType: 'PackageInstallOptions',
        packageId: '444',
        update: true,
      },
    },
  },
  {
    inputAfterConvertFromEditorJSON: `<PackageInstallOptions packageId="444" someNestedObject={{"test":"hello"}} update/>`, // Not test - test is not part of the block
    input: `
<PackageInstallOptions
  update
  packageId="444"
  someNestedObject={{test: "hello"}} test={4}
>
  ignored
</PackageInstallOptions>
`,
    blockNode: {
      fields: {
        blockType: 'PackageInstallOptions',
        packageId: '444',
        update: true,
        someNestedObject: { test: 'hello' },
      },
    },
  },
  {
    inputAfterConvertFromEditorJSON: `<PackageInstallOptions packageId="444" update/>`,

    input: `
<PackageInstallOptions
  update
  packageId="444"
>
  ignored
  <PackageInstallOptions
    update
    packageId="444"
    someNestedObject={{test: "hello"}} test={4}
  >
    ignoredi
  </PackageInstallOptions>
</PackageInstallOptions>
`,
    blockNode: {
      fields: {
        blockType: 'PackageInstallOptions',
        packageId: '444',
        update: true,
      },
    },
  },
  {
    inputAfterConvertFromEditorJSON: `<PackageInstallOptions packageId="444" update/>`,

    input: `
<PackageInstallOptions
  update
  packageId="444"
>
  ignored
  <PackageInstallOptions
    update
    packageId="444"
    someNestedObject={{test: "hello"}} test={4}
  >
    ignoredi
  </PackageInstallOptions>
  <TagThatImmediatelyClosesShouldBeCorrectlyHandledByContentSubTagStartAmount />
  <Tag2 test="hello" />
</PackageInstallOptions>
`,
    blockNode: {
      fields: {
        blockType: 'PackageInstallOptions',
        packageId: '444',
        update: true,
      },
    },
  },
  // TODO: Write test for this:
  /*
<PackageInstallOptions
  update
  packageId="444"
>
  not ignored
  <PackageInstallOptions
    update
    packageId="444"
    someNestedObject={{test: "hello"}} test={4}
  >
    not ignored
  </PackageInstallOptions>
  not ignored
</PackageInstallOptions>
    */
  {
    input: `
\`\`\`ts
hello\`\`\`
`,
    inputAfterConvertFromEditorJSON: `
\`\`\`ts
hello
\`\`\`
`,
    blockNode: {
      fields: {
        blockType: 'Code',
        code: 'hello',
        language: 'ts',
      },
    },
  },
  {
    input: `
\`\`\`ts
 hello\`\`\`
`,
    inputAfterConvertFromEditorJSON: `
\`\`\`ts
 hello
\`\`\`
`,
    blockNode: {
      fields: {
        blockType: 'Code',
        code: ' hello',
        language: 'ts',
      },
    },
  },
  {
    input: `
\`\`\`ts x\n hello\`\`\`
`,
    inputAfterConvertFromEditorJSON: `
\`\`\`ts
 x
 hello
\`\`\`
`,
    blockNode: {
      fields: {
        blockType: 'Code',
        code: ' x\n hello',
        language: 'ts',
      },
    },
  },
  {
    input: `
\`\`\`ts hello\`\`\`
`,
    blockNode: {
      fields: {
        blockType: 'Code',
        code: 'ts hello',
        language: '',
      },
    },
  },
  {
    input: `
\`\`\`hello\`\`\`
`,
    blockNode: {
      fields: {
        blockType: 'Code',
        code: 'hello',
        language: '',
      },
    },
  },
  {
    input: `
\`\`\`ts
hello
\`\`\`
`,
    blockNode: {
      fields: {
        blockType: 'Code',
        code: 'hello',
        language: 'ts',
      },
    },
  },
  {
    input: `
\`\`\`ts hello
there1
\`\`\`
`,
    inputAfterConvertFromEditorJSON: `
\`\`\`ts
 hello
there1
\`\`\`
`,
    blockNode: {
      fields: {
        blockType: 'Code',
        code: ' hello\nthere1',
        language: 'ts',
      },
    },
  },
  {
    input: `
\`\`\`ts hello
there2
!!\`\`\`
`,
    inputAfterConvertFromEditorJSON: `
\`\`\`ts
 hello
there2
!!
\`\`\`
`,
    blockNode: {
      fields: {
        blockType: 'Code',
        code: ' hello\nthere2\n!!',
        language: 'ts',
      },
    },
  },
  {
    input: `
\`\`\`ts
Hello
there3\`\`\`
`,
    inputAfterConvertFromEditorJSON: `
\`\`\`ts
Hello
there3
\`\`\`
`,
    blockNode: {
      fields: {
        blockType: 'Code',
        code: 'Hello\nthere3',
        language: 'ts',
      },
    },
  },
  {
    input: `
\`\`\`ts
Hello
\`\`\`ts
nested
\`\`\`!
there4\`\`\`
`,
    inputAfterConvertFromEditorJSON: `
\`\`\`ts
Hello
\`\`\`ts
nested
\`\`\`!
there4
\`\`\`
`,
    blockNode: {
      fields: {
        blockType: 'Code',
        code: 'Hello\n```ts\nnested\n```!\nthere4',
        language: 'ts',
      },
    },
  },
  {
    ignoreSpacesAndNewlines: true,
    input: `
| Option            | Default route           | Description                                     |
| ----------------- | ----------------------- | ----------------------------------------------- |
| \`account\` \\*         |                         | The user's account page.                        |
| \`createFirstUser\` | \`/create-first-user\`    | The page to create the first user.              |
`,
    inputAfterConvertFromEditorJSON: `
| Option            | Default route           | Description                                     |
|---|---|---|
| \`account\`  \\*         |                         | The user's account page.                        |
| \`createFirstUser\` | \`/create-first-user\`    | The page to create the first user.              |
`,
    rootChildren: [tableJson],
  },
  {
    input: `
<Banner>
  children text
</Banner>
`,
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: textToRichText('children text'),
      },
    },
  },
  {
    input: `
<Banner>
  Escaped \\*
</Banner>
`,
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: textToRichText('Escaped *'),
      },
    },
  },
  {
    input: `\`inline code\``,
    rootChildren: [
      {
        children: [
          {
            detail: 0,
            format: 16, // Format 16 => inline code
            mode: 'normal',
            style: '',
            text: 'inline code',
            type: 'text',
            version: 1,
          },
        ],
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
        textFormat: 0,
        textStyle: '',
      },
    ],
  },
  {
    // This test ensures that the JSX within the code block is does not disrupt the main JSX parsing
    input: `
<Banner>
  \`https://<some link>.payloadcms.com/page\`
</Banner>
`,
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 16, // Format 16 => inline code
                    mode: 'normal',
                    style: '',
                    text: 'https://<some link>.payloadcms.com/page',
                    type: 'text',
                    version: 1,
                  },
                ],
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },
            ],
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    },
  },
  {
    input: 'Hello <InlineCode>inline code</InlineCode> test.',
    rootChildren: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Hello ',
            type: 'text',
            version: 1,
          },
          {
            type: 'inlineBlock',

            fields: {
              code: 'inline code',
              blockType: 'InlineCode',
            },
            version: 1,
          },

          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' test.',
            type: 'text',
            version: 1,
          },
        ],
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
        textFormat: 0,
        textStyle: '',
      },
    ],
  },
  {
    input: `
<Banner>
  Some text 1 <InlineCode>code 1</InlineCode> some

  text 2 <InlineCode>code 2</InlineCode> some text

  3 <InlineCode>code 3</InlineCode> some text 4<InlineCode>code 4</InlineCode>
</Banner>
`,
    description: 'Banner with inline codes, each line a paragraph',
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Some text 1 ',
                    type: 'text',
                    version: 1,
                  },

                  {
                    type: 'inlineBlock',

                    fields: {
                      code: 'code 1',
                      blockType: 'InlineCode',
                    },
                    version: 1,
                  },

                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' some',
                    type: 'text',
                    version: 1,
                  },
                ],
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },

              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'text 2 ',
                    type: 'text',
                    version: 1,
                  },

                  {
                    type: 'inlineBlock',

                    fields: {
                      code: 'code 2',
                      blockType: 'InlineCode',
                    },
                    version: 1,
                  },

                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' some text',
                    type: 'text',
                    version: 1,
                  },
                ],
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },

              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: '3 ',
                    type: 'text',
                    version: 1,
                  },

                  {
                    type: 'inlineBlock',

                    fields: {
                      code: 'code 3',
                      blockType: 'InlineCode',
                    },
                    version: 1,
                  },
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' some text 4',
                    type: 'text',
                    version: 1,
                  },
                  {
                    type: 'inlineBlock',
                    fields: {
                      code: 'code 4',
                      blockType: 'InlineCode',
                    },
                    version: 1,
                  },
                ],
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },
            ],
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    },
  },
  {
    input: `
<Banner>
  Some text 1 <InlineCode>code 1</InlineCode> some

  text 2 <InlineCode>code 2</InlineCode> some text

  3 <InlineCode>code 3</InlineCode> some text 4<InlineCode>code 4</InlineCode>
</Banner>
`,
    description: 'Banner with inline codes, three paragraphs',

    blockNode: {
      fields: {
        blockType: 'Banner',
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Some text 1 ',
                    type: 'text',
                    version: 1,
                  },
                  {
                    type: 'inlineBlock',
                    fields: {
                      code: 'code 1',
                      blockType: 'InlineCode',
                    },
                    version: 1,
                  },
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' some',
                    type: 'text',
                    version: 1,
                  },
                ],
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'text 2 ',
                    type: 'text',
                    version: 1,
                  },
                  {
                    type: 'inlineBlock',
                    fields: {
                      code: 'code 2',
                      blockType: 'InlineCode',
                    },
                    version: 1,
                  },
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' some text',
                    type: 'text',
                    version: 1,
                  },
                ],
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: '3 ',
                    type: 'text',
                    version: 1,
                  },
                  {
                    type: 'inlineBlock',
                    fields: {
                      code: 'code 3',
                      blockType: 'InlineCode',
                    },
                    version: 1,
                  },
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' some text 4',
                    type: 'text',
                    version: 1,
                  },
                  {
                    type: 'inlineBlock',
                    fields: {
                      code: 'code 4',
                      blockType: 'InlineCode',
                    },
                    version: 1,
                  },
                ],
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },
            ],
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    },
  },
  {
    input: `
Text before banner

<Banner>
  test
</Banner>
`,
    rootChildren: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Text before banner',
            type: 'text',
            version: 1,
          },
        ],
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
        textFormat: 0,
        textStyle: '',
      },
      {
        type: 'block',
        format: '',
        fields: {
          blockType: 'Banner',
          content: {
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: 'test',
                      type: 'text',
                      version: 1,
                    },
                  ],
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  textStyle: '',
                  type: 'paragraph',
                  version: 1,
                },
              ],
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          },
        },
        version: 2,
      },
    ],
  },
  {
    description: 'TextContainerNoTrim with nested, no-leftpad content',
    input: `
<TextContainerNoTrim>
no indent

  indent 2

    indent 4

no indent
</TextContainerNoTrim>
`,
    blockNode: {
      fields: {
        blockType: 'TextContainerNoTrim',
        text: `no indent

  indent 2

    indent 4

no indent`,
      },
    },
  },
  {
    description: 'TextContainer with nested, no-leftpad content',

    input: `
<TextContainer>
no indent

  indent 2

    indent 4

no indent
</TextContainer>
`,
    inputAfterConvertFromEditorJSON: `
<TextContainer>
  no indent

    indent 2

      indent 4

  no indent
</TextContainer>
`,
    blockNode: {
      fields: {
        blockType: 'TextContainer',
        text: `no indent

  indent 2

    indent 4

no indent`,
      },
    },
  },
  {
    description: 'TextContainerNoTrim with nested, leftpad content',
    input: `
<TextContainerNoTrim>
  indent 2

    indent 4

      indent 6

  indent 2
</TextContainerNoTrim>
`,
    blockNode: {
      fields: {
        blockType: 'TextContainerNoTrim',
        text: `  indent 2

    indent 4

      indent 6

  indent 2`,
      },
    },
  },
  {
    description: 'TextContainer with nested, leftpad content',
    input: `
<TextContainer>
  indent 2

    indent 4

      indent 6

  indent 2
</TextContainer>
`,
    blockNode: {
      fields: {
        blockType: 'TextContainer',
        text: `indent 2

  indent 4

    indent 6

indent 2`,
      },
    },
  },
  {
    input: `
Some text 1
<InlineCode>code 2</InlineCode>
`,
    description: 'InlineCode after text, split by linebreak',
    rootChildren: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Some text 1',
            type: 'text',
            version: 1,
          },
          {
            type: 'linebreak',
            version: 1,
          },
          {
            type: 'inlineBlock',
            fields: {
              code: 'code 2',
              blockType: 'InlineCode',
            },
            version: 1,
          },
        ],
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
        textFormat: 0,
        textStyle: '',
      },
    ],
  },
  {
    description: 'Code block with nested within Banner',
    input: `
<Banner>
  \`\`\`ts
    indent 1;
  \`\`\`
</Banner>
`,
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: {
          root: {
            children: [
              {
                fields: {
                  blockType: 'Code',
                  code: '  indent 1;',
                  language: 'ts',
                },
                format: '',
                type: 'block',
                version: 2,
              },
            ],
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    },
  },
  {
    description: 'Code block with nested within Banner 2',
    input: `
<Banner>
\`\`\`ts
  indent 1;
\`\`\`
</Banner>
`,
    inputAfterConvertFromEditorJSON: `
<Banner>
  \`\`\`ts
    indent 1;
  \`\`\`
</Banner>
`,
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: {
          root: {
            children: [
              {
                fields: {
                  blockType: 'Code',
                  code: '  indent 1;',
                  language: 'ts',
                },
                format: '',
                type: 'block',
                version: 2,
              },
            ],
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    },
  },
  {
    description: 'One-line Banner',
    input: `
<Banner>Hi</Banner>
`,
    inputAfterConvertFromEditorJSON: `
<Banner>
  Hi
</Banner>
`,
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Hi',
                    type: 'text',
                    version: 1,
                  },
                ],
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },
            ],
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    },
  },
  {
    description: 'Code block with nested within 2 Banners',
    input: `
<Banner>
<Banner>
\`\`\`ts
  indent 1;
\`\`\`
</Banner>
</Banner>
`,
    inputAfterConvertFromEditorJSON: `
<Banner>
  <Banner>
    \`\`\`ts
      indent 1;
    \`\`\`
  </Banner>
</Banner>
`,
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: {
          root: {
            children: [
              {
                type: 'block',
                format: '',
                fields: {
                  blockType: 'Banner',
                  content: {
                    root: {
                      children: [
                        {
                          fields: {
                            blockType: 'Code',
                            code: '  indent 1;',
                            language: 'ts',
                          },
                          format: '',
                          type: 'block',
                          version: 2,
                        },
                      ],
                      format: '',
                      indent: 0,
                      type: 'root',
                      version: 1,
                    },
                  },
                },
                version: 2,
              },
            ],
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    },
  },
  {
    inputAfterConvertFromEditorJSON: `
<Banner>
  Some line [Start of link line2](/some/link)
</Banner>
`,
    input: `
<Banner>
Some line [Start of link
  line2](/some/link)
</Banner>
`,
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Some line ',
                    type: 'text',
                    version: 1,
                  },
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Start of link line2',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    fields: {
                      linkType: 'custom',
                      newTab: false,
                      url: '/some/link',
                    },
                    format: '',
                    indent: 0,
                    type: 'link',
                    version: 3,
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                textFormat: 0,
                textStyle: '',
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    },
  },
  {
    input: `
<Banner>
  Some line [Text **bold** \\*normal\\*](/some/link)
</Banner>
`,
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Some line ',
                    type: 'text',
                    version: 1,
                  },
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Text ',
                        type: 'text',
                        version: 1,
                      },
                      {
                        detail: 0,
                        format: 1,
                        mode: 'normal',
                        style: '',
                        text: 'bold',
                        type: 'text',
                        version: 1,
                      },
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: ' *normal*',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    fields: {
                      linkType: 'custom',
                      newTab: false,
                      url: '/some/link',
                    },
                    format: '',
                    indent: 0,
                    type: 'link',
                    version: 3,
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                textFormat: 0,
                textStyle: '',
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    },
  },
  {
    inputAfterConvertFromEditorJSON: `
<Banner>
  Text text [ Link ](/some/link) .
</Banner>
`,
    input: `
<Banner>
  Text text [ Link
  ](/some/link) .
</Banner>
`,
    blockNode: {
      fields: {
        blockType: 'Banner',
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Text text ',
                    type: 'text',
                    version: 1,
                  },
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: ' Link ',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    fields: {
                      linkType: 'custom',
                      newTab: false,
                      url: '/some/link',
                    },
                    format: '',
                    indent: 0,
                    type: 'link',
                    version: 3,
                  },
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' .',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                textFormat: 0,
                textStyle: '',
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    },
  },
  {
    input: `
<PackageInstallOptions
  update
  packageId="Line"
  someObject={{test: \`Line 1

Line 2\`}}
  ignored>
</PackageInstallOptions>
`,
    inputAfterConvertFromEditorJSON: `<PackageInstallOptions packageId="Line" update someObject={{"test":"Line 1\\n\\nLine 2"}}/>`,
    blockNode: {
      fields: {
        blockType: 'PackageInstallOptions',
        packageId: 'Line',
        someObject: { test: 'Line 1\n\nLine 2' },
        update: true,
      },
    },
  },
]
