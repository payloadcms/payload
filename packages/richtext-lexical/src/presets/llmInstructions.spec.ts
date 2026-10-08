import { sanitizeConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import type { LexicalRichTextAdapter } from '../types/index.js'

import { BlockquoteFeature } from '../features/blockquote/server/index.js'
import { HeadingFeature } from '../features/heading/server/index.js'
import { ParagraphFeature } from '../features/paragraph/server/index.js'
import { lexicalEditor } from '../index.js'
import { NodeFormat } from '../lexical/utils/nodeFormat.js'

describe('LLM instructions preset', () => {
  it('should use its own exact feature set instead of inheriting root features', () => {
    const editor = createPreset()

    expect([...editor.editorConfig.features.enabledFeatures].sort()).toEqual([
      'bold',
      'heading',
      'italic',
      'orderedList',
      'paragraph',
      'strikethrough',
      'toolbarFixed',
      'toolbarInline',
      'unorderedList',
    ])
  })

  it('should convert only H2-H4 headings and leave unsupported levels as plain text', () => {
    const editor = createPreset()
    const markdown = '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6'
    const data = editor.converters.fromMarkdown({ markdown })

    expect(data.root.children).toMatchObject([
      { type: 'paragraph', children: [{ type: 'text', text: '# H1', format: 0 }] },
      { type: 'heading', tag: 'h2' },
      { type: 'heading', tag: 'h3' },
      { type: 'heading', tag: 'h4' },
      { type: 'paragraph', children: [{ type: 'text', text: '##### H5', format: 0 }] },
      { type: 'paragraph', children: [{ type: 'text', text: '###### H6', format: 0 }] },
    ])
    expect(editor.converters.toMarkdown({ data })).toBe(markdown)
  })

  it('should preserve formatting and both list types when converting to and from Markdown', () => {
    const editor = createPreset()
    const markdown = '## Instructions\n\n**Bold** *italic* ~~removed~~\n\n- Bullet\n\n1. First'
    const data = editor.converters.fromMarkdown({ markdown })

    expect(data.root.children).toMatchObject([
      { type: 'heading', tag: 'h2' },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Bold', format: NodeFormat.IS_BOLD },
          { type: 'text', text: ' ', format: 0 },
          { type: 'text', text: 'italic', format: NodeFormat.IS_ITALIC },
          { type: 'text', text: ' ', format: 0 },
          { type: 'text', text: 'removed', format: NodeFormat.IS_STRIKETHROUGH },
        ],
      },
      { type: 'list', listType: 'bullet' },
      { type: 'list', listType: 'number' },
    ])
    expect(editor.converters.toMarkdown({ data })).toBe(markdown)
  })
})

const createPreset = (): LexicalRichTextAdapter => {
  const config = sanitizeConfig({
    db: {
      defaultIDType: 'text',
      init: () => {
        throw new Error('This test does not initialize a database.')
      },
    },
    editor: lexicalEditor({
      features: [
        ParagraphFeature(),
        HeadingFeature({ enabledHeadingSizes: ['h1', 'h6'] }),
        BlockquoteFeature(),
      ],
    }),
    secret: 'test',
  })

  return config.editor!.presets!.llmInstructions!({
    config,
    isRoot: false,
    parentIsLocalized: false,
  }) as LexicalRichTextAdapter
}
