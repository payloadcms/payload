import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { UploadComponentHasMany } from './index.js'

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'general:dragToReorder' ? 'Drag to reorder' : key),
  }),
}))

vi.mock('../RelationshipContent/index.js', () => ({
  RelationshipContent: ({ filename }: { filename: string }) => <span>{filename}</span>,
}))

test('should give each drag handle an accessible name with the filename', async () => {
  const screen = await render(
    <UploadComponentHasMany
      fileDocs={[
        { relationTo: 'media', value: { id: 1, filename: 'first.png' } },
        { relationTo: 'media', value: { id: 2, filename: 'second.png' } },
      ]}
      isSortable
      onRemove={vi.fn()}
      onReorder={vi.fn()}
      reloadDoc={vi.fn()}
      serverURL="http://localhost:3000"
    />,
  )

  await expect
    .element(screen.getByRole('button', { name: 'Drag to reorder first.png' }))
    .toBeInTheDocument()
  await expect
    .element(screen.getByRole('button', { name: 'Drag to reorder second.png' }))
    .toBeInTheDocument()
})
