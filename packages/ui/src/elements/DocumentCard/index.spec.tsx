import type { LinkAdapterProps, RouterAdapterRouter } from 'payload'

import { act } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
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

test('should keep selection available without navigating when the href is null', async () => {
  const onSelect = vi.fn()
  const push = vi.fn()
  const TestLink = ({ href, ...props }: LinkAdapterProps) => <a href={href} {...props} />

  const screen = await render(
    <RouterAdapterContext
      value={{
        Link: TestLink,
        params: {},
        pathname: '/',
        router: { back: vi.fn(), push, refresh: vi.fn(), replace: vi.fn() },
        searchParams: new URLSearchParams(),
      }}
    >
      <DocumentCard href={null} onSelect={onSelect} title="Example document" />
    </RouterAdapterContext>,
  )
  const card = screen.getByRole('button', { name: 'Example document' })

  expect(document.querySelector('.document-card a')).toBeNull()
  await card.click()
  expect(onSelect).toHaveBeenCalledOnce()
  await userEvent.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledTimes(2)
  await userEvent.keyboard(' ')
  expect(onSelect).toHaveBeenCalledTimes(3)
  await card.dblClick()
  expect(push).not.toHaveBeenCalled()
})

test('should show the placeholder when the thumbnail fails to load', async () => {
  const TestLink = ({ href, ...props }: LinkAdapterProps) => <a href={href} {...props} />

  const screen = await render(
    <RouterAdapterContext
      value={{
        Link: TestLink,
        params: {},
        pathname: '/',
        router: { back: vi.fn(), push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
        searchParams: new URLSearchParams(),
      }}
    >
      <DocumentCard
        placeholder="Preview"
        thumbnail={{ src: 'data:application/pdf,not-an-image' }}
        title="Example document"
      />
    </RouterAdapterContext>,
  )

  await expect.element(screen.getByText('Preview')).toBeVisible()
  expect(document.querySelector('img.document-card__thumbnail')).toBeNull()
})

test('should show a new thumbnail after the previous one failed to load', async () => {
  const validSrc =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  const TestLink = ({ href, ...props }: LinkAdapterProps) => <a href={href} {...props} />
  const renderCard = ({ src }: { src: string }) => (
    <RouterAdapterContext
      value={{
        Link: TestLink,
        params: {},
        pathname: '/',
        router: { back: vi.fn(), push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
        searchParams: new URLSearchParams(),
      }}
    >
      <DocumentCard placeholder="Preview" thumbnail={{ src }} title="Example document" />
    </RouterAdapterContext>
  )

  const screen = await render(renderCard({ src: 'data:application/pdf,not-an-image' }))

  await expect.element(screen.getByText('Preview')).toBeVisible()
  await screen.rerender(renderCard({ src: validSrc }))
  await expect.element(screen.getByText('Preview')).not.toBeInTheDocument()
  expect(document.querySelector('img.document-card__thumbnail')?.getAttribute('src')).toBe(validSrc)
})

test('should show the placeholder when the thumbnail failed to load before hydration', async () => {
  const TestLink = ({ href, ...props }: LinkAdapterProps) => <a href={href} {...props} />
  const card = (
    <RouterAdapterContext
      value={{
        Link: TestLink,
        params: {},
        pathname: '/',
        router: { back: vi.fn(), push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
        searchParams: new URLSearchParams(),
      }}
    >
      <DocumentCard
        placeholder="Preview"
        thumbnail={{ src: 'data:application/pdf,not-an-image' }}
        title="Example document"
      />
    </RouterAdapterContext>
  )
  const serverContainer = document.createElement('div')
  const serverRoot = createRoot(serverContainer)

  flushSync(() => serverRoot.render(card))

  const container = document.createElement('div')

  container.innerHTML = serverContainer.innerHTML
  serverRoot.unmount()
  document.body.append(container)

  const image = container.querySelector('img')!

  await expect.poll(() => image.complete).toBe(true)
  const root = await act(() => hydrateRoot(container, card))

  await expect
    .poll(() => container.querySelector('.document-card__thumbnail--empty'))
    .not.toBeNull()
  expect(container.querySelector('img')).toBeNull()
  root.unmount()
  container.remove()
})
