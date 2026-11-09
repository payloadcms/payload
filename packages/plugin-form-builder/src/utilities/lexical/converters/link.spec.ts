import { describe, expect, it } from 'vitest'

import '../serializeLexical.js'
import { replaceDoubleCurlys } from '../../replaceDoubleCurlys.js'

const { LinkHTMLConverter } = await import('./link.js')

describe('LinkHTMLConverter', () => {
  it('handles internal links with numeric doc id when submissionData is provided', async () => {
    const result = await LinkHTMLConverter.converter({
      converters: [],
      node: {
        children: [],
        fields: {
          doc: {
            relationTo: 'pages',
            value: {
              id: 123,
            },
          },
          linkType: 'internal',
          newTab: false,
        },
      },
      parent: {},
      submissionData: [{ field: 'name', value: 'John' }],
    })
    expect(result).toBe('<a href="123"></a>')
  })

  it('handles internal links with unpopulated doc id value', async () => {
    const result = await LinkHTMLConverter.converter({
      converters: [],
      node: {
        children: [],
        fields: {
          doc: {
            relationTo: 'pages',
            value: 456,
          },
          linkType: 'internal',
          newTab: false,
        },
      },
      parent: {},
      submissionData: [{ field: 'name', value: 'John' }],
    })
    expect(result).toBe('<a href="456"></a>')
  })

  it('handles internal links with string doc id', async () => {
    const result = await LinkHTMLConverter.converter({
      converters: [],
      node: {
        children: [],
        fields: {
          doc: {
            relationTo: 'pages',
            value: {
              id: 'page-abc-123',
            },
          },
          linkType: 'internal',
          newTab: false,
        },
      },
      parent: {},
      submissionData: [{ field: 'name', value: 'John' }],
    })
    expect(result).toBe('<a href="page-abc-123"></a>')
  })

  it('handles custom links with submissionData variable replacement', async () => {
    const result = await LinkHTMLConverter.converter({
      converters: [],
      node: {
        children: [],
        fields: {
          linkType: 'custom',
          newTab: true,
          url: 'https://example.com/user/{{userId}}',
        },
      },
      parent: {},
      submissionData: [{ field: 'userId', value: '999' }],
    })
    expect(result).toBe(
      '<a href="https://example.com/user/999" rel="noopener noreferrer" target="_blank"></a>',
    )
  })

  it('blocks javascript: in link href', async () => {
    const result = await LinkHTMLConverter.converter({
      converters: [],
      node: {
        children: [],
        fields: {
          linkType: 'custom',
          newTab: false,
          url: 'javascript:alert(1)',
        },
      },
      parent: {},
      submissionData: undefined,
    })
    expect(result).toBe('<a href="#"></a>')
  })
})

describe('replaceDoubleCurlys', () => {
  it('handles numeric and non-string inputs gracefully', () => {
    const testVariables = [{ field: 'name', value: 'John' }]
    expect(replaceDoubleCurlys(123 as any, testVariables)).toBe('123')
    expect(replaceDoubleCurlys(null as any, testVariables)).toBe('')
    expect(replaceDoubleCurlys(undefined as any, testVariables)).toBe('')
  })

  it('replaces named variables in string', () => {
    const testVariables = [{ field: 'name', value: 'John' }]
    expect(replaceDoubleCurlys('Hello {{name}}', testVariables)).toBe('Hello John')
  })
})
