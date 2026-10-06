import type { QueryDraftDataFromCollectionSlug } from 'payload'

import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { find, renderBlocks, renderHero, renderRichText } = vi.hoisted(() => ({
  find: vi.fn(),
  renderBlocks: vi.fn((_props: { blocks?: unknown[] }) => null),
  renderHero: vi.fn((_props: Record<string, unknown>) => null),
  renderRichText: vi.fn((_props: { data: unknown }) => null),
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('payload', () => ({ getPayload: async () => ({ find }) }))
vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: true }) }))
vi.mock('@/components/PayloadRedirects', () => ({ PayloadRedirects: () => null }))
vi.mock('@/components/LivePreviewListener', () => ({ LivePreviewListener: () => null }))
vi.mock('@/components/Media', () => ({ Media: () => null }))
vi.mock('@/blocks/RenderBlocks', () => ({ RenderBlocks: renderBlocks }))
vi.mock('@/heros/RenderHero', () => ({ RenderHero: renderHero }))
vi.mock('@/components/RichText', () => ({ default: renderRichText }))
vi.mock('@/utilities/generateMeta', () => ({ generateMeta: () => ({}) }))
vi.mock('@/app/(frontend)/[slug]/page.client', () => ({ default: () => null }))
vi.mock('@/app/(frontend)/posts/[slug]/page.client', () => ({ default: () => null }))

import Page from '@/app/(frontend)/[slug]/page'
import Post from '@/app/(frontend)/posts/[slug]/page'

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('Draft previews', () => {
  it('should render a page draft without a hero or layout', async () => {
    const page: QueryDraftDataFromCollectionSlug<'pages'> = { id: 'draft-preview', slug: 'draft' }

    find.mockResolvedValue({ docs: [page] })

    render(await Page({ params: Promise.resolve({ slug: 'draft' }) }))

    expect(renderHero).not.toHaveBeenCalled()
    expect(renderBlocks.mock.calls[0]?.[0]).toMatchObject({ blocks: [] })
  })

  it('should render a post draft without a title or content', async () => {
    const post: QueryDraftDataFromCollectionSlug<'posts'> = { id: 'draft-preview', slug: 'draft' }

    find.mockResolvedValue({ docs: [post] })

    render(await Post({ params: Promise.resolve({ slug: 'draft' }) }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Untitled post')
    expect(renderRichText).not.toHaveBeenCalled()
  })

  it('should render the title and content when present in a post draft', async () => {
    const post: QueryDraftDataFromCollectionSlug<'posts'> = {
      id: 'draft-preview',
      title: 'Preview title',
      content: {
        root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 },
      },
    }

    find.mockResolvedValue({ docs: [post] })

    render(await Post({ params: Promise.resolve({ slug: 'draft' }) }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Preview title')
    expect(renderRichText.mock.calls[0]?.[0]).toMatchObject({ data: post.content })
  })
})
