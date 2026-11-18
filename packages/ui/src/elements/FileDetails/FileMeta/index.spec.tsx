import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { FileMeta } from './index.js'

test('should leave out the file size when the document has none', async () => {
  const screen = await render(
    <FileMeta
      filename="photo.png"
      filesize={null}
      height={600}
      mimeType="image/png"
      url="/api/media/file/photo.png"
      width={800}
    />,
  )

  await expect.element(screen.getByText('800x600 - image/png')).toBeInTheDocument()
})
