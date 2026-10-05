import type { LinkAdapterProps, RouterAdapterRouter } from 'payload'

import { expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import { RouterAdapterContext } from '../../providers/RouterAdapter/index.js'
import { DocumentCard } from './index.js'

test('should use the href as a full-card link when selection is unavailable', async () => {
  const push = vi.fn()
  const router: RouterAdapterRouter = {
    back: vi.fn(),
    push,
    refresh: vi.fn(),
    replace: vi.fn(),
  }
  const TestLink = ({ href, ...props }: LinkAdapterProps) => <a href={href} {...props} />

  const screen = await render(
    <RouterAdapterContext
      value={{
        Link: TestLink,
        params: {},
        pathname: '/',
        router,
        searchParams: new URLSearchParams(),
      }}
    >
      <DocumentCard href="/documents/1" placeholder="Preview" title="Example document" />
    </RouterAdapterContext>,
  )

  const cardElement = document.querySelector<HTMLElement>('.document-card')
  const card = page.elementLocator(cardElement!)
  const link = screen.getByRole('link', { name: 'Example document' })

  await expect.element(link).toHaveAttribute('href', '/documents/1')
  await expect.element(card).not.toHaveAttribute('role')
  await card.click({ position: { x: 10, y: 10 } })
  expect(push).toHaveBeenCalledWith('/documents/1', { scroll: undefined })
})

test('should keep nested actions interactive on an href-only card', async () => {
  const edit = vi.fn()
  const push = vi.fn()
  const router: RouterAdapterRouter = {
    back: vi.fn(),
    push,
    refresh: vi.fn(),
    replace: vi.fn(),
  }
  const TestLink = ({ href, ...props }: LinkAdapterProps) => <a href={href} {...props} />

  const screen = await render(
    <RouterAdapterContext
      value={{
        Link: TestLink,
        params: {},
        pathname: '/',
        router,
        searchParams: new URLSearchParams(),
      }}
    >
      <DocumentCard href="/documents/1" placeholder="Preview" title="Example document">
        <button onClick={edit} type="button">
          Edit
        </button>
      </DocumentCard>
    </RouterAdapterContext>,
  )

  await screen.getByRole('button', { name: 'Edit' }).click()
  expect(edit).toHaveBeenCalledOnce()
  expect(push).not.toHaveBeenCalled()
})
