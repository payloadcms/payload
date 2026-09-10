import type { Config, Field } from 'payload'

import { describe, expect, it } from 'vitest'

import { seoPlugin } from './index.js'

const runTabbedUI = (fields: Field[]) => {
  const plugin = seoPlugin({ collections: ['posts'], tabbedUI: true })
  const result = plugin({
    collections: [
      {
        fields,
        slug: 'posts',
      },
    ],
  } as unknown as Config)
  return result.collections?.[0]?.fields ?? []
}

const contentTabFields = (fields: Field[]): Field[] => {
  const tabs = fields.find((field) => field.type === 'tabs')
  if (tabs?.type !== 'tabs' || !Array.isArray(tabs.tabs)) {
    return []
  }
  const contentTab = tabs.tabs.find((tab) => tab.label === 'Content')
  return contentTab && 'fields' in contentTab ? (contentTab.fields as Field[]) : []
}

describe('seoPlugin tabbedUI sidebar fields', () => {
  it('keeps admin.position sidebar fields at the top level instead of the Content tab', () => {
    const fields = runTabbedUI([
      { name: 'title', type: 'text' },
      { admin: { position: 'sidebar' }, name: 'status', type: 'text' },
    ])

    const topLevelNames = fields
      .filter((field) => 'name' in field)
      .map((field) => (field as { name: string }).name)
    expect(topLevelNames).toContain('status')

    const contentNames = contentTabFields(fields)
      .filter((field) => 'name' in field)
      .map((field) => (field as { name: string }).name)
    expect(contentNames).toContain('title')
    expect(contentNames).not.toContain('status')
  })

  it('leaves collections without sidebar fields unchanged', () => {
    const fields = runTabbedUI([{ name: 'title', type: 'text' }])

    const contentNames = contentTabFields(fields)
      .filter((field) => 'name' in field)
      .map((field) => (field as { name: string }).name)
    expect(contentNames).toContain('title')
  })
})
