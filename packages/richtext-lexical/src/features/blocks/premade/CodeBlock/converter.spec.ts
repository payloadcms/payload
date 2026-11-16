import type { SerializedEditorState } from 'lexical'

import { describe, expect, it } from 'vitest'

import type { SanitizedServerEditorConfig } from '../../../../lexical/config/types.js'
import type { ResolvedServerFeatureMap } from '../../../typesServer.js'
import type { SerializedBlockNode } from '../../server/nodes/BlocksNode.js'

import { sanitizeServerFeatures } from '../../../../lexical/config/server/sanitize.js'
import { convertLexicalToMarkdown } from '../../../converters/lexicalToMarkdown/index.js'
import { convertMarkdownToLexical } from '../../../converters/markdownToLexical/index.js'
import { getBlockMarkdownTransformers } from '../../server/markdown/markdownTransformer.js'
import { ServerBlockNode } from '../../server/nodes/BlocksNode.js'
import { CodeBlock } from './index.js'

const resolvedFeatureMap: ResolvedServerFeatureMap = new Map([
  [
    'blocks',
    {
      dependencies: [],
      dependenciesPriority: [],
      dependenciesSoft: [],
      key: 'blocks',
      markdownTransformers: getBlockMarkdownTransformers({
        blocks: [CodeBlock()],
        inlineBlocks: [],
      }),
      nodes: [{ node: ServerBlockNode }],
      order: 0,
    },
  ],
])

const editorConfig: SanitizedServerEditorConfig = {
  features: sanitizeServerFeatures(resolvedFeatureMap),
  lexical: undefined,
  resolvedFeatureMap,
}

function importFields(markdown: string): { code: string; language?: string } {
  const editorState = convertMarkdownToLexical({ editorConfig, markdown })
  const blockNode = editorState.root.children[0] as SerializedBlockNode

  return blockNode.fields as { code: string; language?: string }
}

function exportMarkdown(fields: { code: string; language?: string }): string {
  const data: SerializedEditorState = {
    root: {
      children: [
        {
          fields: { blockType: 'Code', id: '1', ...fields },
          format: '',
          type: 'block',
          version: 2,
        } as SerializedBlockNode,
      ],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }

  return convertLexicalToMarkdown({ data, editorConfig })
}

describe('CodeBlock markdown converter', () => {
  describe('import', () => {
    it('should import a fenced block with a language and a multi-line body', () => {
      const fields = importFields('```ts\nimport x\n\nconsole.log(x)\n```')

      expect(fields).toMatchObject({ code: 'import x\n\nconsole.log(x)', language: 'ts' })
    })

    it('should import a bare fenced block with a multi-line body', () => {
      const fields = importFields('```\nline1\nline2\n```')

      expect(fields.code).toBe('line1\nline2')
      expect(fields.language).toBeUndefined()
    })

    it('should import a bare fenced block with a single-line body', () => {
      const fields = importFields('```\ncode\n```')

      expect(fields.code).toBe('code')
      expect(fields.language).toBeUndefined()
    })

    it('should import a single-line fenced word as code', () => {
      expect(importFields('```foo```')).toMatchObject({ code: 'foo', language: '' })
    })

    it('should import a single-line fenced block starting with a non-word character', () => {
      expect(importFields('```$ ls```')).toMatchObject({ code: '$ ls', language: '' })
    })

    it('should import a single-line fenced block where code and language are space-separated', () => {
      expect(importFields('```ts hello```')).toMatchObject({ code: 'ts hello', language: '' })
    })

    it.each([
      ['c++', 'int x;'],
      ['c#', 'x = 1;'],
      ['objective-c', 'foo();'],
      ['shell-session', '$ ls'],
    ])(
      'should import the info string `%s` as language instead of leaking it into the code',
      (language, code) => {
        expect(importFields('```' + language + '\n' + code + '\n```')).toMatchObject({
          code,
          language,
        })
      },
    )

    it('should store an info string that is not in the languages list verbatim', () => {
      expect(importFields('```http\nGET /\n```')).toMatchObject({ code: 'GET /', language: 'http' })
    })

    it('should import an empty fenced block', () => {
      const fields = importFields('```\n```')

      expect(fields.code).toBe('')
      expect(fields.language).toBeUndefined()
    })
  })

  describe('export and re-import', () => {
    it('should export a single-line block without language in the single-line form', () => {
      expect(exportMarkdown({ code: 'foo', language: '' })).toBe('```foo```')
    })

    it('should export a block with a language in the multi-line form', () => {
      expect(exportMarkdown({ code: 'const a = 1', language: 'ts' })).toBe(
        '```ts\nconst a = 1\n```',
      )
    })

    it('should round-trip a single-line block whose code starts with a non-word character', () => {
      const markdown = exportMarkdown({ code: '$ npm i -g x', language: '' })

      expect(markdown).toBe('```$ npm i -g x```')
      expect(importFields(markdown)).toMatchObject({ code: '$ npm i -g x', language: '' })
    })

    it('should round-trip a single-line block whose code starts with a space', () => {
      const markdown = exportMarkdown({ code: ' x', language: '' })

      expect(markdown).toBe('``` x```')
      expect(importFields(markdown)).toMatchObject({ code: ' x', language: '' })
    })

    it('should round-trip a single-line block whose code starts with backticks', () => {
      const markdown = exportMarkdown({ code: '``x', language: '' })

      expect(markdown).toBe('`````x```')
      expect(importFields(markdown)).toMatchObject({ code: '``x', language: '' })
    })

    it('should round-trip a single-line block without language', () => {
      const markdown = exportMarkdown({ code: 'foo', language: '' })

      expect(importFields(markdown)).toMatchObject({ code: 'foo', language: '' })
    })

    it('should round-trip an empty block', () => {
      const markdown = exportMarkdown({ code: '', language: '' })

      expect(importFields(markdown)).toMatchObject({ code: '', language: '' })
    })

    it('should round-trip a block with a language', () => {
      const markdown = exportMarkdown({ code: 'const a = 1', language: 'ts' })

      expect(importFields(markdown)).toMatchObject({ code: 'const a = 1', language: 'ts' })
    })
  })
})
