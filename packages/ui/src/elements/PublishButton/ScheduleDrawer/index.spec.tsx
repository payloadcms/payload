import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ScheduleDrawer } from './index.js'

const { getUpcomingScheduledPublish, schedulePublish, toast, config, i18n, t } = vi.hoisted(() => ({
  config: {
    admin: {
      dateFormat: 'yyyy-MM-dd',
      timezones: { defaultTimezone: 'UTC', supportedTimezones: [] },
    },
  },
  getUpcomingScheduledPublish: vi.fn(),
  i18n: { language: 'en' },
  schedulePublish: vi.fn(),
  t: (key: string) => key,
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('sonner', () => ({ toast }))
vi.mock('../../../providers/Config/index.js', () => ({ useConfig: () => ({ config }) }))
vi.mock('../../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({ id: 'post', collectionSlug: 'posts' }),
}))
vi.mock('../../../providers/DocumentTitle/index.js', () => ({
  useDocumentTitle: () => ({ title: 'Post' }),
}))
vi.mock('../../../providers/Translation/index.js', () => ({ useTranslation: () => ({ i18n, t }) }))
vi.mock('../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ getUpcomingScheduledPublish, schedulePublish }),
}))
vi.mock('../../../fields/FieldLabel/index.js', () => ({ FieldLabel: () => null }))
vi.mock('../../../fields/RadioGroup/Radio/index.js', () => ({ Radio: () => null }))
vi.mock('../../Button/index.js', () => ({
  Button: (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button disabled={props.disabled} onClick={props.onClick} type="button">
      {props.children}
    </button>
  ),
}))
vi.mock('../../DatePicker/index.js', () => ({
  DatePickerField: ({ onChange }: { onChange: (date: Date) => void }) => (
    <button onClick={() => onChange(new Date('2030-01-01T00:00:00Z'))} type="button">
      Choose date
    </button>
  ),
}))
vi.mock('../../TimezonePicker/index.js', () => ({ TimezonePicker: () => null }))
vi.mock('../../ReactSelect/index.js', () => ({ ReactSelect: () => null }))
vi.mock('../../ShimmerEffect/index.js', () => ({ ShimmerEffect: () => null }))
vi.mock('../../Drawer/index.js', () => ({
  Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../../Gutter/index.js', () => ({
  Gutter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../../Banner/index.js', () => ({
  Banner: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../../Table/index.js', () => ({
  Table: ({ columns }: { columns: ReactNode }) => <div>{columns}</div>,
}))
vi.mock('./buildUpcomingColumns.js', () => ({
  buildUpcomingColumns: ({ deleteHandler }: { deleteHandler: (id: string) => void }) => (
    <button onClick={() => deleteHandler('job')} type="button">
      Cancel job
    </button>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  getUpcomingScheduledPublish.mockResolvedValue([{ id: 'job' }])
  schedulePublish.mockResolvedValue({ error: 'Switch to main to schedule' })
})

afterEach(() => vi.restoreAllMocks())

test('should show a scheduling error without reporting success or clearing the date', async () => {
  const screen = await render(<ScheduleDrawer slug="schedule" />)

  await screen.getByRole('button', { name: 'Choose date' }).click()
  await screen.getByRole('button', { name: 'general:save' }).click()

  await expect.poll(() => toast.error.mock.calls).toEqual([['Switch to main to schedule']])
  expect(toast.success).not.toHaveBeenCalled()
  expect(getUpcomingScheduledPublish).toHaveBeenCalledOnce()
  await expect.element(screen.getByRole('button', { name: 'general:save' })).toBeEnabled()
  await screen.getByRole('button', { name: 'general:save' }).click()
  expect(schedulePublish).toHaveBeenCalledTimes(2)
})

test('should show a cancellation error without reporting success or refreshing', async () => {
  const screen = await render(<ScheduleDrawer slug="schedule" />)

  await screen.getByRole('button', { name: 'Cancel job' }).click()

  await expect.poll(() => toast.error.mock.calls).toEqual([['Switch to main to schedule']])
  expect(toast.success).not.toHaveBeenCalled()
  expect(getUpcomingScheduledPublish).toHaveBeenCalledOnce()
})
