import type { LinkAdapterProps } from 'payload'

import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { RouterAdapterContext } from '../../../providers/RouterAdapter/index.js'
import { DocumentGrid } from './index.js'

const TestLink = ({ href, ...props }: LinkAdapterProps) => <a href={href} {...props} />

const renderGrid = async ({ cover }: { cover: unknown }) => {
  return render(
    <RouterAdapterContext
      value={{
        Link: TestLink,
        params: {},
        pathname: '/',
        router: { back: vi.fn(), push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
        searchParams: new URLSearchParams(),
      }}
    >
      <DocumentGrid
        adminRoute="/admin"
        collectionLabel="Posts"
        collectionSlug="posts"
        docs={[{ id: '1', title: 'Example document', cover }]}
        documentURLs={{ '1': '/admin/collections/posts/1' }}
        useAsThumbnail="cover"
        useAsTitle="title"
      />
    </RouterAdapterContext>,
  )
}

test.each([{ cover: [] }, { cover: ['unpopulated-id'] }, { cover: null }])(
  'should render a placeholder for an unavailable thumbnail %j',
  async ({ cover }) => {
    const screen = await renderGrid({ cover })

    await expect.element(screen.getByRole('link', { name: 'Example document' })).toBeVisible()
    expect(document.querySelector('.document-card__thumbnail--empty')).not.toBeNull()
    expect(document.querySelector('.document-card img')).toBeNull()
  },
)
