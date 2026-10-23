import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { UploadDropzoneContent } from './index.js'

test('should give the icon-only paste button an accessible name', async () => {
  const screen = await render(
    <UploadDropzoneContent
      onFilesSelected={vi.fn()}
      onPasteFromClipboard={vi.fn()}
      pasteTooltip="Paste from clipboard"
    />,
  )

  await expect.element(screen.getByRole('button', { name: 'Paste from clipboard' })).toBeVisible()
})
