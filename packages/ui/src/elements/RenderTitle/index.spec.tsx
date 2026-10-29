import type { RenderTitleProps } from './index.js'

import { expect, describe, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { RenderTitle } from './index.js'

const context = vi.hoisted(() => ({
  id: undefined as number | string | undefined,
  title: '',
}))

vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({ config: { routes: { admin: '/admin' } } }),
}))

vi.mock('../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({
    id: context.id,
    collectionSlug: 'posts',
    isInitializing: false,
  }),
}))

vi.mock('../../providers/DocumentTitle/index.js', () => ({
  useDocumentTitle: () => ({ isPlaceholder: false, title: context.title }),
}))

vi.mock('../Drawer/index.js', () => ({
  useDrawerDepth: () => 0,
}))

export const renderTitle = ({
  id,
  props = {},
  title = '',
}: {
  id?: number | string
  props?: RenderTitleProps
  title?: string
}) => {
  context.id = id
  context.title = title

  return render(<RenderTitle {...props} />)
}

describe('RenderTitle', () => {
  test('should render ID as title when there is a numerical title', async () => {
    const { getByText } = await renderTitle({ id: 123, title: '123' })
    expect(getByText('123')).toBeInTheDocument()
  })

  test('should render title when there is no id', async () => {
    const { getByText } = await renderTitle({ title: 'My Title' })
    expect(getByText('My Title')).toBeInTheDocument()
  })
})
