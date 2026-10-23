import type { LivePreviewContextType } from '../../providers/LivePreview/context.js'

import { t } from '@payloadcms/translations'
import { enTranslations } from '@payloadcms/translations/languages/en'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { LivePreviewContext } from '../../providers/LivePreview/context.js'
import { PreviewButton } from './index.js'

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    t: (key: string) => t({ key, translations: enTranslations }),
  }),
}))

test('should give the icon-only preview button an accessible name', async () => {
  const screen = await render(
    <LivePreviewContext
      value={{ previewURL: 'https://example.com/preview' } as LivePreviewContextType}
    >
      <PreviewButton />
    </LivePreviewContext>,
  )

  const button = screen.getByRole('button', { name: 'Copy' })

  await expect.element(button).toBeVisible()
  await expect.element(button).not.toHaveAttribute('title')
})
