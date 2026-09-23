import { sanitizeConfig } from 'payload'
import { assert, describe, expect, it } from 'vitest'

import type { LexicalEditorProps } from '../../types/index.js'

import { lexicalEditor } from '../../index.js'
import { BoldFeature } from '../format/bold/feature.server.js'
import { HeadingFeature } from '../heading/server/index.js'
import { ParagraphFeature } from '../paragraph/server/index.js'

describe('editor adapter Markdown converters', () => {
  it('should import and export Markdown with the configured features', () => {
    const { fromMarkdown, toMarkdown } = createConverters({
      features: [
        ParagraphFeature(),
        HeadingFeature({ enabledHeadingSizes: ['h2'] }),
        BoldFeature(),
      ],
    })
    const markdown = '## Heading\n\nSome **bold** text.'
    const data = fromMarkdown({ markdown })

    expect(data.root.children[0]).toMatchObject({ type: 'heading', tag: 'h2' })
    expect(toMarkdown({ data })).toBe(markdown)
  })

  it('should keep disabled heading levels as text when importing Markdown', () => {
    const { fromMarkdown } = createConverters({
      features: [ParagraphFeature(), HeadingFeature({ enabledHeadingSizes: ['h2'] })],
    })
    const data = fromMarkdown({ markdown: '# Disabled heading' })

    expect(data.root.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', text: '# Disabled heading' }],
    })
  })

  it('should use the receiving editor features when exporting stored data', () => {
    const { fromMarkdown } = createConverters({ features: [ParagraphFeature(), BoldFeature()] })
    const { toMarkdown } = createConverters({ features: [ParagraphFeature()] })
    const data = fromMarkdown({ markdown: '**Bold text**' })

    expect(toMarkdown({ data })).toBe('Bold text')
  })
})

const createConverters = ({ features }: { features: LexicalEditorProps['features'] }) => {
  const config = sanitizeConfig({
    db: {
      defaultIDType: 'text',
      init: () => {
        throw new Error('These conversion tests do not initialize a database.')
      },
    },
    editor: lexicalEditor({ features }),
    secret: 'test-secret',
  })
  const fromMarkdown = config.editor?.converters?.fromMarkdown
  const toMarkdown = config.editor?.converters?.toMarkdown

  assert(fromMarkdown)
  assert(toMarkdown)

  return { fromMarkdown, toMarkdown }
}
