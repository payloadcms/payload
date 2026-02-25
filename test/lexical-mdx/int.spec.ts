import type {
  BlockFields,
  LexicalRichTextAdapter,
  SanitizedServerEditorConfig,
  SerializedBlockNode,
} from '@payloadcms/richtext-lexical'
import type { RichTextField, SanitizedConfig } from 'payload'
import type { MarkOptional } from 'ts-essentials'

import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'
import { editorJSONToMDX, mdxToEditorJSON } from './mdx/hooks.js'
import { codeTest1 } from './tests/code1.test.js'
import { defaultTests } from './tests/default.test.js'
import { restExamplesTest1 } from './tests/restExamples.test.js'
import { restExamplesTest2 } from './tests/restExamples2.test.js'

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
  convertFromEditorJSON?: boolean
  convertToEditorJSON?: boolean
  debugFlag?: boolean
  description?: string
  ignoreSpacesAndNewlines?: boolean
  input: string
  inputAfterConvertFromEditorJSON?: string
  rootChildren?: any[]
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

  describe('upload markdown: Markdown → Lexical (import)', () => {
    function countUploadNodes(node: {
      type?: string
      children?: unknown[]
      [key: string]: unknown
    }): number {
      let n = node.type === 'upload' ? 1 : 0
      const children =
        node.children ?? (node.fields as { root?: { children?: unknown[] } })?.root?.children
      if (Array.isArray(children)) {
        for (const c of children) {
          n += countUploadNodes(c as typeof node)
        }
      }
      return n
    }

    function collectUploadNodes(node: {
      type?: string
      relationTo?: string
      value?: unknown
      children?: unknown[]
      [key: string]: unknown
    }): { relationTo: string; value: unknown }[] {
      const out: { relationTo: string; value: unknown }[] = []
      if (node.type === 'upload' && node.relationTo != null) {
        out.push({ relationTo: node.relationTo, value: node.value })
      }
      const children =
        node.children ?? (node.fields as { root?: { children?: unknown[] } })?.root?.children
      if (Array.isArray(children)) {
        for (const c of children) {
          out.push(...collectUploadNodes(c as typeof node))
        }
      }
      return out
    }

    it('imports upload placeholder as upload node and verifies it is there', () => {
      const markdown = '![uploads:123]()'
      const result = mdxToEditorJSON({ mdxWithFrontmatter: markdown, editorConfig })
      const rootChildren = result.editorState.root?.children ?? []
      const uploads = rootChildren.flatMap((child) =>
        collectUploadNodes(
          child as { type?: string; relationTo?: string; value?: unknown; [key: string]: unknown },
        ),
      )
      expect(uploads).toHaveLength(1)
      expect(uploads[0].relationTo).toBe('uploads')
      expect(uploads[0].value).toBe(123)
    })

    it('imports image markdown without creating upload node and preserves content', () => {
      const markdown = '![alt](/uploads/image.jpg)'
      const result = mdxToEditorJSON({ mdxWithFrontmatter: markdown, editorConfig })
      const rootChildren = result.editorState.root?.children ?? []
      expect(rootChildren.length).toBeGreaterThanOrEqual(1)
      const uploadCount = rootChildren.reduce(
        (sum, child) =>
          sum +
          countUploadNodes(
            child as { type?: string; children?: unknown[]; [key: string]: unknown },
          ),
        0,
      )
      expect(uploadCount).toBe(0)
      const text = JSON.stringify(result.editorState)
      expect(text).toMatch(/alt|image\.jpg|\/uploads\//)
    })
  })
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
