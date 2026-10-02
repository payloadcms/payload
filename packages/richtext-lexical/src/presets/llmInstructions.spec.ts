import { sanitizeConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import type { LexicalRichTextAdapter } from '../types/index.js'

import { BlockquoteFeature } from '../features/blockquote/server/index.js'
import { HeadingFeature } from '../features/heading/server/index.js'
import { ParagraphFeature } from '../features/paragraph/server/index.js'
import { lexicalEditor } from '../index.js'

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

  it('should preserve formatting and both list types when converting to and from Markdown', () => {
    const editor = createPreset()
    const markdown = '## Instructions\n\n**Bold** *italic* ~~removed~~\n\n- Bullet\n\n1. First'
    const data = editor.converters.fromMarkdown({ markdown })

    expect(data.root.children).toMatchObject([
      { type: 'heading', tag: 'h2' },
      { type: 'paragraph' },
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
