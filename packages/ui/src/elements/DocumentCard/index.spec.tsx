import type { LinkAdapterProps, RouterAdapterRouter } from 'payload'

import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import { VIDEO_PREVIEW_PLAY_DELAY_MS } from '../../hooks/useVideoPreviewPlayback.js'
import { RouterAdapterContext } from '../../providers/RouterAdapter/index.js'
import { VIDEO_FRAME_TIME } from '../../utilities/getVideoThumbnailSrc.js'
import { createTestVideo } from '../../utilities/testVideo.spec.fixture.js'
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

test('should show the placeholder when a video thumbnail fails to load', async () => {
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
        thumbnail={{ alt: 'Clip', isVideo: true, src: '/missing-clip.mp4' }}
        title="Example document"
      />
    </RouterAdapterContext>,
  )

  await expect.element(screen.getByText('Preview')).toBeInTheDocument()
  expect(document.querySelector('.document-card__thumbnail--video video')).toBeNull()
  expect(document.querySelector('img.document-card__thumbnail')).toBeNull()
})

test('should play a video thumbnail while hovered and return to its frame after', async () => {
  const src = URL.createObjectURL(await createTestVideo())
  const { card, video } = await renderLoadedVideoCard(src)

  await card.hover()
  await expect.poll(() => video.paused).toBe(false)
  expect(video.muted).toBe(true)

  await userEvent.unhover(card)
  expect(video.paused).toBe(true)
  expect(video.currentTime).toBeCloseTo(VIDEO_FRAME_TIME)
  URL.revokeObjectURL(src)
})

test('should not play a video thumbnail when the user prefers reduced motion', async () => {
  const matchMedia = window.matchMedia.bind(window)
  // `all` always matches, so it stands in for the reduced motion preference
  const matchMediaSpy = vi
    .spyOn(window, 'matchMedia')
    .mockImplementation((query) =>
      matchMedia(query === '(prefers-reduced-motion: reduce)' ? 'all' : query),
    )
  const src = URL.createObjectURL(await createTestVideo())
  const { card, video } = await renderLoadedVideoCard(src)

  await card.hover()
  await new Promise((resolve) => setTimeout(resolve, VIDEO_PREVIEW_PLAY_DELAY_MS * 2))
  expect(video.paused).toBe(true)

  matchMediaSpy.mockRestore()
  URL.revokeObjectURL(src)
})

async function renderLoadedVideoCard(src: string) {
  const TestLink = ({ href, ...props }: LinkAdapterProps) => <a href={href} {...props} />

  await render(
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
        thumbnail={{ alt: 'Clip', isVideo: true, src }}
        title="Example document"
      />
    </RouterAdapterContext>,
  )

  await expect
    .poll(() => document.querySelector<HTMLVideoElement>('.document-card video')?.hidden)
    .toBe(false)

  const card = page.elementLocator(document.querySelector('.document-card') ?? document.body)
  const video = document.querySelector<HTMLVideoElement>('.document-card video')

  if (!video) {
    throw new Error('Expected the video thumbnail to render')
  }

  return { card, video }
}
