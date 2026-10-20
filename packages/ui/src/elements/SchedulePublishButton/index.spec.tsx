import { t } from '@payloadcms/translations'
import { enTranslations } from '@payloadcms/translations/languages/en'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { SchedulePublishButton } from './index.js'

vi.mock('@faceless-ui/modal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@faceless-ui/modal')>()),
  useModal: () => ({ isModalOpen: () => false, toggleModal: vi.fn() }),
}))

vi.mock('../PublishButton/ScheduleDrawer/index.js', () => ({
  ScheduleDrawer: () => null,
}))

vi.mock('../../forms/Form/context.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../forms/Form/context.js')>()),
  useFormModified: () => false,
}))

vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({
    getEntityConfig: () => ({ versions: { drafts: { schedulePublish: true } } }),
  }),
}))

vi.mock('../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({
    id: '1',
    collectionSlug: 'posts',
    hasPublishPermission: true,
    hasScheduledPublish: false,
    setHasScheduledPublish: vi.fn(),
    unpublishedVersionCount: 0,
  }),
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    t: (key: string) => t({ key, translations: enTranslations }),
  }),
}))

test('should give the icon-only schedule publish button an accessible name', async () => {
  const screen = await render(<SchedulePublishButton />)

  const button = screen.getByRole('button', { name: 'Schedule Publish' })

  await expect.element(button).toBeVisible()
  await expect.element(button).not.toHaveAttribute('title')
})
