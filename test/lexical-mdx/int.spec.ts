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
import { restExamplesTest1 } from './tests/restExamples.test.js'
import { restExamplesTest2 } from './tests/restExamples2.test.js'

import { defaultTests } from './tests/default.test.js'
import { writeFileSync } from 'fs'
import { codeTest1 } from './tests/code1.test.js'

let config: SanitizedConfig
let editorConfig: SanitizedServerEditorConfig

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export type Test = {
  blockNode?: {
    fields: Omit<BlockFields, 'id'>
  } & Omit<
    MarkOptional<SerializedBlockNode, 'children' | 'fields' | 'format' | 'type' | 'version'>,
    'fields'
  >
  debugFlag?: boolean
  description?: string
  ignoreSpacesAndNewlines?: boolean
  input: string
  inputAfterConvertFromEditorJSON?: string
  rootChildren?: any[]
  convertToEditorJSON?: boolean
  convertFromEditorJSON?: boolean
}
type Tests = Array<Test>

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
    ...defaultTests,
    restExamplesTest1,
    restExamplesTest2,
    codeTest1,
  ]

  const INPUT_AND_OUTPUT: Tests = INPUT_AND_OUTPUTBase.find((test) => test.debugFlag)
    ? [INPUT_AND_OUTPUTBase.find((test) => test.debugFlag)]
    : INPUT_AND_OUTPUTBase

  for (const {
    input,
    inputAfterConvertFromEditorJSON,
    blockNode,
    ignoreSpacesAndNewlines,
    rootChildren,
    debugFlag,
    description,
    convertFromEditorJSON,
    convertToEditorJSON,
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

    if (convertToEditorJSON !== false) {
      it(`can convert to editor JSON: ${description ?? sanitizedInput}"`, () => {
        const result = mdxToEditorJSON({
          mdxWithFrontmatter: sanitizedInput,
          editorConfig,
        })

        if (debugFlag) {
          writeFileSync(path.resolve(dirname, 'result.json'), JSON.stringify(result, null, 2))
        }

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

          expect(receivedBlockNodeToTest).toStrictEqual(blockNode)
        } else if (rootChildren) {
          const receivedRootChildren = result.editorState.root.children
          removeUndefinedAndIDRecursively(receivedRootChildren)
          removeUndefinedAndIDRecursively(rootChildren)

          expect(receivedRootChildren).toStrictEqual(rootChildren)
        } else {
          throw new Error('Test not configured properly')
        }
      })
    }

    if (convertFromEditorJSON !== false) {
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

        expect(resultNoSpace).toBe(inputNoSpace)
      })
    }
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
