import { sanitizeConfig } from 'payload'
import { assert, describe, expect, it } from 'vitest'

import { HeadingFeature } from '../features/heading/server/index.js'
import { ParagraphFeature } from '../features/paragraph/server/index.js'
import { lexicalEditor } from '../index.js'

describe('LLM instructions editor preset', () => {
  it('should use restricted features independently of the root editor', () => {
    const { instructionsEditor, rootEditor } = createEditors()
    const markdown = '# Title\n\n## Instructions\n\nUse **clear** wording.'
    const instructions = instructionsEditor.converters!.fromMarkdown!({ markdown })
    const root = rootEditor.converters!.fromMarkdown!({ markdown })

    expect(root.root.children[0]).toMatchObject({ type: 'heading', tag: 'h1' })
    expect(root.root.children[1]).toMatchObject({ type: 'paragraph' })
    expect(instructions.root.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', text: '# Title' }],
    })
    expect(instructions.root.children[1]).toMatchObject({ type: 'heading', tag: 'h2' })
    expect(instructionsEditor.converters!.toMarkdown!({ data: instructions })).toContain(
      'Use **clear** wording.',
    )
  })

  it('should support lists in Markdown instructions', () => {
    const { instructionsEditor } = createEditors()
    const data = instructionsEditor.converters!.fromMarkdown!({
      markdown: '- First instruction\n- Second instruction\n\n1. First step\n2. Second step',
    })

    expect(data.root.children).toMatchObject([
      { type: 'list', listType: 'bullet', children: [{ type: 'listitem' }, { type: 'listitem' }] },
      { type: 'list', listType: 'number', children: [{ type: 'listitem' }, { type: 'listitem' }] },
    ])
    expect(instructionsEditor.converters!.toMarkdown!({ data })).toContain('1. First step')
  })
})

const createEditors = () => {
  const config = sanitizeConfig({
    db: {
      defaultIDType: 'text',
      init: () => {
        throw new Error('These preset tests do not initialize a database.')
      },
    },
    editor: lexicalEditor({
      features: [ParagraphFeature(), HeadingFeature({ enabledHeadingSizes: ['h1'] })],
    }),
    secret: 'test-secret',
  })
  const rootEditor = config.editor
  const preset = rootEditor?.presets?.llmInstructions

  assert(rootEditor)
  assert(preset)

  const instructionsEditor = preset({ config, isRoot: false, parentIsLocalized: false })

  return { instructionsEditor, rootEditor }
}
