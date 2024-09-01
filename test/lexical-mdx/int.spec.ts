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
  input: string
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
    {
      input: `
| Option            | Default route           | Description                                     |
| ----------------- | ----------------------- | ----------------------------------------------- |
| \`account\`         |                         | The user's account page.                        |
| \`createFirstUser\` | \`/create-first-user\`    | The page to create the first user.              |
`,
      rootChildren: [tableJson],
    },
  ]

  for (const { input, blockNode, rootChildren } of INPUT_AND_OUTPUT) {
    it(`can convert to editor JSON: ${input}"`, () => {
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
      } else if (rootChildren) {
        const receivedRootChildren = result.editorState.root.children
        removeUndefinedRecursively(receivedRootChildren)
        //
        expect(receivedRootChildren).toStrictEqual(rootChildren)
      } else {
        throw new Error('Test not configured properly')
      }
    })

    it(`can convert from editor JSON: ${input}"`, () => {
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
          direction: null,
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
      const resultNoSpace = result.replace(/\s/g, '')
      const inputNoSpace = input.replace(/\s/g, '')

      expect(resultNoSpace).toBe(inputNoSpace)
    })
  }
})

function removeUndefinedRecursively(obj: object) {
  for (const key in obj) {
    const value = obj[key]
    if (value && typeof value === 'object') {
      removeUndefinedRecursively(value)
    } else if (value === undefined) {
      delete obj[key]
    }
  }
}
