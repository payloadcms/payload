import type {
  BlockFields,
  LexicalRichTextAdapter,
  SerializedBlockNode,
} from '@payloadcms/richtext-lexical'
import type { RichTextField, SanitizedConfig } from 'payload'
import type { MarkOptional } from 'ts-essentials'

import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'
import { mdxToEditorJSON } from './mdx/hooks.js'

let config: SanitizedConfig

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type Tests = Array<{
  blockNode?: {
    fields: Omit<BlockFields, 'id'>
  } & Omit<
    MarkOptional<SerializedBlockNode, 'children' | 'fields' | 'format' | 'type' | 'version'>,
    'fields'
  >
  input: string
}>

describe('Lexical MDX', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const { config: incomingConfig } = await initPayloadInt(dirname, undefined, false)
    config = incomingConfig
  })

  const INPUT_AND_OUTPUT: Tests = [
    {
      input: `
<PackageInstallOptions
  packageId="444"
  update uniqueId="xxx"/>
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
      input: `
\`\`\`ts hello\`\`\`
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
there
\`\`\`
`,
      blockNode: {
        fields: {
          blockType: 'Code',
          code: 'hello\nthere',
          language: 'ts',
        },
      },
    },
    {
      input: `
\`\`\`ts hello
there
!!\`\`\`
`,
      blockNode: {
        fields: {
          blockType: 'Code',
          code: 'hello\nthere\n!!',
          language: 'ts',
        },
      },
    },
    {
      input: `
\`\`\`ts
Hello
there\`\`\`
`,
      blockNode: {
        fields: {
          blockType: 'Code',
          code: 'hello\nthere',
          language: 'ts',
        },
      },
    },
  ]

  for (const { input, blockNode } of INPUT_AND_OUTPUT) {
    it(`can correctly convert to editor JSON: ${input}"`, () => {
      const richTextField: RichTextField = config.collections
        .find((collection) => collection.slug === postsSlug)
        .fields.find(
          (field) => 'name' in field && field.name === 'richText',
        ) as unknown as RichTextField

      const editorConfig = (richTextField.editor as LexicalRichTextAdapter).editorConfig

      const result = mdxToEditorJSON({
        mdxWithFrontmatter: input,
        editorConfig,
      })

      if (blockNode) {
        const receivedBlockNode: SerializedBlockNode = result.editorState.root
          .children[0] as unknown as SerializedBlockNode
        expect(receivedBlockNode).not.toBeNull()

        // By doing it like this, the blockNode defined in the test does not need to have all the top-level properties
        const receivedBlockNodeToTest = {}
        for (const key in blockNode) {
          receivedBlockNodeToTest[key] = receivedBlockNode[key]
          if (key === 'fields') {
            delete receivedBlockNodeToTest[key].id
            // Delete all undefined values
            for (const fieldKey in receivedBlockNodeToTest[key]) {
              if (receivedBlockNodeToTest[key][fieldKey] === undefined) {
                delete receivedBlockNodeToTest[key][fieldKey]
              }
            }
          }
        }

        expect(receivedBlockNodeToTest).toStrictEqual(blockNode)
      } else {
        throw new Error('Block node not found. Each test needs to define a block node')
      }
    })
  }
})
