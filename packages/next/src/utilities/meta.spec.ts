import { describe, expect, it } from 'vitest'

import { generateMetadata } from './meta.js'

describe('generateMetadata', () => {
  it('should handle a string title with titleSuffix', async () => {
    const result = await generateMetadata({
      serverURL: 'http://localhost:3000',
      title: 'Dashboard',
      titleSuffix: '- My CMS',
    })

    expect(result.title).toBe('Dashboard - My CMS')
  })

  it('should pass a TemplateString title object through unchanged, ignoring titleSuffix', async () => {
    const result = await generateMetadata({
      serverURL: 'http://localhost:3000',
      title: { default: 'My CMS', template: '%s | My CMS' },
      titleSuffix: '- Payload',
    })

    // TemplateString should be preserved as-is — the user has taken control of title formatting
    expect(typeof result.title).toBe('object')
    expect((result.title as { default: string; template: string }).default).toBe('My CMS')
    expect((result.title as { default: string; template: string }).template).toBe('%s | My CMS')
  })

  it('should use the TemplateString default for ogTitle when title is a TemplateString object', async () => {
    const result = await generateMetadata({
      serverURL: 'http://localhost:3000',
      title: { default: 'My CMS', template: '%s | My CMS' },
      titleSuffix: '- Payload',
    })

    // OG title must be a plain string — extract from TemplateString.default and append titleSuffix
    expect(result.openGraph?.title).toBe('My CMS - Payload')
  })

  it('should use the TemplateString absolute for ogTitle when title has absolute property', async () => {
    const result = await generateMetadata({
      serverURL: 'http://localhost:3000',
      title: { absolute: 'My CMS Absolute' },
      titleSuffix: '- Payload',
    })

    expect(result.openGraph?.title).toBe('My CMS Absolute - Payload')
  })

  it('should pass a TemplateString with absolute through unchanged for metaTitle', async () => {
    const result = await generateMetadata({
      serverURL: 'http://localhost:3000',
      title: { absolute: 'My CMS Absolute' },
      titleSuffix: '- Payload',
    })

    expect(typeof result.title).toBe('object')
    expect((result.title as { absolute: string }).absolute).toBe('My CMS Absolute')
  })

  it('should use openGraph.title string over incomingMetadata.title for ogTitle', async () => {
    const result = await generateMetadata({
      serverURL: 'http://localhost:3000',
      title: 'My CMS',
      titleSuffix: '- Payload',
      openGraph: { title: 'Custom OG Title' },
    })

    expect(result.openGraph?.title).toBe('Custom OG Title')
  })

  it('should return undefined for metaTitle when no title and no titleSuffix are set', async () => {
    const result = await generateMetadata({
      serverURL: 'http://localhost:3000',
    })

    expect(result.title).toBeUndefined()
  })

  it('should return just the title when no titleSuffix is set', async () => {
    const result = await generateMetadata({
      serverURL: 'http://localhost:3000',
      title: 'My CMS',
    })

    expect(result.title).toBe('My CMS')
  })
})
