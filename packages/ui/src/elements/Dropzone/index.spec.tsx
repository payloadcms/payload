import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Dropzone } from './index.js'

const renderDropzone = async ({
  dropzoneStyle,
}: {
  dropzoneStyle: 'default' | 'none' | 'outline'
}) => {
  const screen = await render(
    <Dropzone dropzoneStyle={dropzoneStyle} onChange={() => null}>
      <p>Content</p>
    </Dropzone>,
  )

  return screen.container.querySelector('.dropzone')
}

test('should add a tab stop for a default dropzone', async () => {
  const dropzone = await renderDropzone({ dropzoneStyle: 'default' })

  expect(dropzone?.getAttribute('tabindex')).toBe('0')
})

test('should not add a tab stop for an outline dropzone, which wraps a large area', async () => {
  const dropzone = await renderDropzone({ dropzoneStyle: 'outline' })

  expect(dropzone?.hasAttribute('tabindex')).toBe(false)
})
