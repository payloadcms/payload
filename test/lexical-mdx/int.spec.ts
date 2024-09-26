/* eslint jest/no-conditional-in-test: 0 */
import type {
  BlockFields,
  LexicalRichTextAdapter,
  SanitizedServerEditorConfig,
  SerializedBlockNode,
} from '@payloadcms/richtext-lexical'
import type { RichTextField, SanitizedConfig } from 'payload'
import type { MarkOptional } from 'ts-essentials'

import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'
import { editorJSONToMDX, mdxToEditorJSON } from './mdx/hooks.js'
import { tableJson } from './tableJson.js'
import { textToRichText } from './textToRichText.js'

let config: SanitizedConfig
let editorConfig: SanitizedServerEditorConfig

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type Tests = Array<{
  blockNode?: {
    fields: Omit<BlockFields, 'id'>
  } & Omit<
    MarkOptional<SerializedBlockNode, 'children' | 'fields' | 'format' | 'type' | 'version'>,
    'fields'
  >
  description?: string
  ignoreSpacesAndNewlines?: boolean
  input: string
  inputAfterConvertFromEditorJSON?: string
  rootChildren?: any[]
}>

describe('Lexical MDX', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const { config: incomingConfig } = await initPayloadInt(dirname, undefined, false)
    config = incomingConfig

    const richTextField: RichTextField = config.collections
      .find((collection) => collection.slug === postsSlug)
      .fields.find(
        (field) => 'name' in field && field.name === 'richText',
      ) as unknown as RichTextField

    editorConfig = (richTextField.editor as LexicalRichTextAdapter).editorConfig
  })

  const INPUT_AND_OUTPUTBase: Tests = [
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
| \`account\`         |                         | The user's account page.                        |
| \`createFirstUser\` | \`/create-first-user\`    | The page to create the first user.              |
`,
      inputAfterConvertFromEditorJSON: `
| Option            | Default route           | Description                                     |
|---|---|---|
| \`account\`         |                         | The user's account page.                        |
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
      description: 'Banner with inline codes, each line a linebreak, one paragraph',

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
                    {
                      type: 'linebreak',
                      version: 1,
                    },
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
                    {
                      type: 'linebreak',
                      version: 1,
                    },
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
  ]

  const INPUT_AND_OUTPUT: Tests = INPUT_AND_OUTPUTBase

  for (const {
    input,
    inputAfterConvertFromEditorJSON,
    blockNode,
    ignoreSpacesAndNewlines,
    rootChildren,
    description,
  } of INPUT_AND_OUTPUT) {
    let sanitizedInput = input
    // Remove beginning and end newline of input if exists (since the input is a template string)
    if (sanitizedInput.startsWith('\n')) {
      sanitizedInput = sanitizedInput.slice(1)
    }
    if (sanitizedInput.endsWith('\n')) {
      sanitizedInput = sanitizedInput.slice(0, -1)
    }

    let sanitizedInputAfterConvertFromEditorJSON = inputAfterConvertFromEditorJSON
    if (sanitizedInputAfterConvertFromEditorJSON) {
      if (sanitizedInputAfterConvertFromEditorJSON.startsWith('\n')) {
        sanitizedInputAfterConvertFromEditorJSON = sanitizedInputAfterConvertFromEditorJSON.slice(1)
      }
      if (sanitizedInputAfterConvertFromEditorJSON.endsWith('\n')) {
        sanitizedInputAfterConvertFromEditorJSON = sanitizedInputAfterConvertFromEditorJSON.slice(
          0,
          -1,
        )
      }
    }

    it(`can convert to editor JSON: ${description ?? sanitizedInput}"`, () => {
      const result = mdxToEditorJSON({
        mdxWithFrontmatter: sanitizedInput,
        editorConfig,
      })

      if (blockNode) {
        const receivedBlockNode: SerializedBlockNode = result.editorState.root
          .children[0] as unknown as SerializedBlockNode
        expect(receivedBlockNode).not.toBeNull()

        // By doing it like this, the blockNode defined in the test does not need to have all the top-level properties. We only wanna compare keys that are defined in the test
        const receivedBlockNodeToTest = {}
        for (const key in blockNode) {
          receivedBlockNodeToTest[key] = receivedBlockNode[key]
        }

        removeUndefinedAndIDRecursively(receivedBlockNodeToTest)
        removeUndefinedAndIDRecursively(blockNode)

        console.log({ receivedBlockNodeToTest, blockNode })

        expect(receivedBlockNodeToTest).toStrictEqual(blockNode)
      } else if (rootChildren) {
        const receivedRootChildren = result.editorState.root.children
        removeUndefinedAndIDRecursively(receivedRootChildren)
        removeUndefinedAndIDRecursively(rootChildren)

        console.log({ receivedRootChildren, rootChildren })

        expect(receivedRootChildren).toStrictEqual(rootChildren)
      } else {
        throw new Error('Test not configured properly')
      }
    })

    it(`can convert from editor JSON: ${description ?? sanitizedInput}"`, () => {
      const editorState = {
        root: {
          children: blockNode
            ? [
                {
                  format: '',
                  type: 'block',
                  version: 2,
                  ...blockNode,
                },
              ]
            : rootChildren,
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      }
      const result = editorJSONToMDX({
        editorConfig,
        editorState,
      })
      // Remove all spaces and newlines
      const resultNoSpace = ignoreSpacesAndNewlines ? result.replace(/\s/g, '') : result
      const inputNoSpace = ignoreSpacesAndNewlines
        ? (sanitizedInputAfterConvertFromEditorJSON ?? sanitizedInput).replace(/\s/g, '')
        : (sanitizedInputAfterConvertFromEditorJSON ?? sanitizedInput)

      console.log({ result: resultNoSpace, expected: inputNoSpace })

      expect(resultNoSpace).toBe(inputNoSpace)
    })
  }
})

function removeUndefinedAndIDRecursively(obj: object) {
  for (const key in obj) {
    const value = obj[key]
    if (value && typeof value === 'object') {
      removeUndefinedAndIDRecursively(value)
    } else if (value === undefined) {
      delete obj[key]
    } else if (value === null) {
      delete obj[key]
    } else if (key === 'id') {
      delete obj[key]
    }
  }
}
