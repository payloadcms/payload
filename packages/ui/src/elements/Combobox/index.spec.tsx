import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import { Combobox } from './index.js'

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: () => 'No matches found' }),
}))

const entries = ['Alpha', 'Beta', 'Gamma'].map((name) => ({ name, Component: <span>{name}</span> }))

test('should preserve slots and popup width while filtering and announce empty results', async () => {
  const screen = await render(
    <Combobox
      theme="auto"
      aria-label="Choose an item"
      button="Choose"
      entries={entries}
      footer={({ close }) => (
        <button onClick={close} type="button">
          Create item
        </button>
      )}
      header={() => <div>Current item</div>}
      minEntriesForSearch={0}
      searchPlaceholder="Search items"
    />,
  )

  await screen.getByRole('button', { name: 'Choose', exact: true }).click()
  const input = screen.getByRole('textbox', { name: 'Search items' })

  await expect.element(input).toHaveFocus()
  const content = input.element().closest('.combobox__content') as HTMLElement
  const width = content.getBoundingClientRect().width

  await input.fill('missing')
  await expect.element(screen.getByRole('status')).toHaveTextContent('No matches found')
  await expect.element(screen.getByText('Current item')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Create item' })).toBeVisible()
  expect(Math.abs(content.getBoundingClientRect().width - width)).toBeLessThanOrEqual(1)

  await screen.getByRole('button', { name: 'Create item' }).click()
  await expect.element(screen.getByRole('button', { name: 'Choose', exact: true })).toHaveFocus()
})

test('should support keyboard selection and reset search after dismissal', async () => {
  const onSelect = vi.fn()
  const screen = await render(
    <Combobox
      theme="auto"
      button="Choose"
      entries={entries}
      minEntriesForSearch={0}
      onSelect={onSelect}
      searchPlaceholder="Search items"
    />,
  )

  const trigger = screen.getByRole('button', { name: 'Choose', exact: true })

  await trigger.click()
  await screen.getByRole('textbox', { name: 'Search items' }).fill('be')
  await userEvent.keyboard('{Tab}{Enter}')
  expect(onSelect).toHaveBeenCalledWith(entries[1])
  await expect.element(trigger).toHaveFocus()

  await trigger.click()
  await expect.element(screen.getByRole('textbox', { name: 'Search items' })).toHaveValue('')
  await userEvent.keyboard('{Escape}')
  await expect.element(trigger).toHaveFocus()
})
