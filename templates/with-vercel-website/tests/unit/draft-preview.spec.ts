import Page from '@/app/(frontend)/[slug]/page'
import Post from '@/app/(frontend)/posts/[slug]/page'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { draftMode, find } = vi.hoisted(() => ({ draftMode: vi.fn(), find: vi.fn() }))

vi.mock('payload', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getPayload: () => Promise.resolve({ find }),
}))
vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('next/headers', () => ({ draftMode }))
vi.mock('@/components/PayloadRedirects', () => ({ PayloadRedirects: () => null }))
vi.mock('@/components/LivePreviewListener', () => ({ LivePreviewListener: () => null }))
vi.mock('@/app/(frontend)/[slug]/page.client', () => ({ default: () => null }))
vi.mock('@/app/(frontend)/posts/[slug]/page.client', () => ({ default: () => null }))
vi.mock('@/blocks/Code/Component', () => ({ CodeBlock: () => null }))

const content = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Preview body',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
}

describe('partial draft previews', () => {
  beforeEach(() => {
    find.mockReset()
    draftMode.mockReset().mockResolvedValue({ isEnabled: true })
  })
  afterEach(() => {
    cleanup()
  })

  it('should render a draft page without a hero or layout', async () => {
    find.mockResolvedValue({ docs: [{ id: 1 }] })

    render(await Page({ params: Promise.resolve({ slug: 'partial-page' }) }))

    expect(document.querySelector('article')).not.toBeNull()
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ version: 'latest' }))
  })

  it('should render a draft post without rich text content', async () => {
    find.mockResolvedValue({ docs: [{ id: 1, title: 'Partial post' }] })

    render(await Post({ params: Promise.resolve({ slug: 'partial-post' }) }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Partial post')
    expect(screen.queryByText('Preview body')).toBeNull()
  })

  it('should give an untitled draft post a meaningful heading', async () => {
    find.mockResolvedValue({ docs: [{ id: 1, content }] })

    render(await Post({ params: Promise.resolve({ slug: 'untitled-post' }) }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Untitled post')
    expect(screen.getByText('Preview body')).not.toBeNull()
  })

  it('should retain a published post heading and content', async () => {
    draftMode.mockResolvedValue({ isEnabled: false })
    find.mockResolvedValue({ docs: [{ id: 1, content, title: 'Complete post' }] })

    render(await Post({ params: Promise.resolve({ slug: 'complete-post' }) }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Complete post')
    expect(screen.getByText('Preview body')).not.toBeNull()
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ overrideAccess: false, version: 'published' }),
    )
  })
})
