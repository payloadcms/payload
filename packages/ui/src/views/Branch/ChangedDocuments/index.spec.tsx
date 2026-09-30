import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ChangedDocuments } from './index.js'

const serverFunction = vi.hoisted(() => vi.fn())
const translate = vi.hoisted(
  () =>
    (key: string, args?: { label?: string }): string =>
      key === 'general:selectLabel' ? `Select ${args?.label}` : key,
)

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    getEntityConfig: () => ({ labels: { singular: 'Post' } }),
  }),
}))

vi.mock('../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: {}, t: translate }),
}))

test('should give each merge selection checkbox a document-specific accessible name', async () => {
  const toggleSelected = vi.fn()
  const screen = await render(
    <ChangedDocuments
      branch="feature"
      changes={[
        {
          collectionSlug: 'posts',
          docID: 42,
          id: 'change-1',
          operation: 'update',
        },
      ]}
      selected={new Set()}
      toggleSelected={toggleSelected}
    />,
  )

  const checkbox = screen.getByRole('checkbox', { name: 'Select 42' })

  await checkbox.click()
  expect(toggleSelected).toHaveBeenCalledWith('change-1')
})
