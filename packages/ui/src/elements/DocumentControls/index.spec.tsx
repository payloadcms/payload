import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { DocumentControls } from './index.js'

const { collectionConfig, livePreview, togglerMock } = vi.hoisted(() => ({
  collectionConfig: {
    slug: 'posts',
    admin: {},
    labels: { plural: 'Posts', singular: 'Post' },
  },
  livePreview: { isLivePreviewEnabled: false },
  togglerMock: { rendersNull: false },
}))

vi.mock('../../providers/Config/index.js', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfig: () => ({
    config: {
      admin: { dateFormat: 'MMMM do yyyy, h:mm a' },
      localization: false,
      routes: { admin: '/admin' },
    },
    getEntityConfig: ({ collectionSlug }: { collectionSlug?: string }) =>
      collectionSlug ? collectionConfig : undefined,
  }),
}))

vi.mock('../../providers/LivePreview/context.js', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useLivePreviewContext: () => livePreview,
}))

vi.mock('../LivePreview/Toggler/index.js', () => ({
  LivePreviewToggler: () =>
    togglerMock.rendersNull ? null : <button type="button">Toggle live preview</button>,
}))

const renderControls = () =>
  render(
    <DocumentControls
      apiURL=""
      BeforeDocumentControls={<button type="button">Custom control</button>}
      disableActions
      isEditing
      permissions={null}
      slug="posts"
    />,
  )

test('should not render the icon buttons wrapper when no icon button is shown', async () => {
  livePreview.isLivePreviewEnabled = false

  const screen = await renderControls()

  await expect.element(screen.getByRole('button', { name: 'Custom control' })).toBeVisible()
  expect(document.querySelector('.doc-controls__icon-buttons')).toBeNull()
})

test('should render the icon buttons wrapper when an icon button is shown', async () => {
  livePreview.isLivePreviewEnabled = true
  togglerMock.rendersNull = false

  const screen = await renderControls()
  const toggler = screen.getByRole('button', { name: 'Toggle live preview' })

  await expect.element(toggler).toBeVisible()
  expect(toggler.element().closest('.doc-controls__icon-buttons')).not.toBeNull()
})

test('should hide the icon buttons wrapper when its enabled icon buttons render nothing', async () => {
  livePreview.isLivePreviewEnabled = true
  togglerMock.rendersNull = true

  const screen = await renderControls()

  await expect.element(screen.getByRole('button', { name: 'Custom control' })).toBeVisible()
  const wrapper = document.querySelector('.doc-controls__icon-buttons')
  expect(wrapper).not.toBeNull()
  expect(getComputedStyle(wrapper!).display).toBe('none')
})
