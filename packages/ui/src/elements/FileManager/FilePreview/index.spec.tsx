import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { FilePreview } from './index.js'

const renderPreview = (data: Record<string, unknown>) =>
  render(
    <FilePreview
      collectionSlug="media"
      data={data}
      setSelectedSize={() => {}}
      uploadConfig={{} as never}
      UploadFilePreview={<div />}
    />,
  )

test('should leave out the file size when the document has none', async () => {
  const screen = await renderPreview({
    filesize: null,
    height: 600,
    mimeType: 'image/png',
    width: 800,
  })

  await expect.element(screen.getByText('800 × 600 – image/png')).toBeInTheDocument()
})
