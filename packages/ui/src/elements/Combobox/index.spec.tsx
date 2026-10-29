import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import { Combobox } from './index.js'
import '../../css/app.css'

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

test('should lock the unfiltered width before removing long labels', async () => {
  const longName = 'International language configuration and formatting options'
  const screen = await render(
    <Combobox
      theme="auto"
      button="Choose"
      entries={[
        { name: longName, Component: <span style={{ whiteSpace: 'nowrap' }}>{longName}</span> },
        ...entries,
      ]}
      minEntriesForSearch={0}
    />,
  )

  await screen.getByRole('button', { name: 'Choose', exact: true }).click()
  const input = screen.getByRole('textbox')
  const content = input.element().closest('.combobox__content') as HTMLElement
  const width = content.getBoundingClientRect().width

  expect(width).toBeGreaterThan(240)
  await input.fill('be')
  expect(Math.abs(content.getBoundingClientRect().width - width)).toBeLessThanOrEqual(1)
  await input.fill('missing')
  expect(Math.abs(content.getBoundingClientRect().width - width)).toBeLessThanOrEqual(1)
  await input.fill('')
  expect(Math.abs(content.getBoundingClientRect().width - width)).toBeLessThanOrEqual(1)
})

test.each([false, true])(
  'should keep slots in view while entries scroll with showScrollbar=%s',
  async (showScrollbar) => {
    const screen = await render(
      <Combobox
        theme="auto"
        button="Choose"
        entries={Array.from({ length: 40 }, (_, index) => ({
          name: `Item ${index}`,
          Component: <span className="popup-button-list__label">Item {index}</span>,
        }))}
        showScrollbar={showScrollbar}
        header={() => <div>Current item</div>}
        footer={({ close }) => (
          <button onClick={close} type="button">
            Create item
          </button>
        )}
      />,
    )

    await screen.getByRole('button', { name: 'Choose', exact: true }).click()
    const input = screen.getByRole('textbox')
    const content = input.element().closest('.combobox__content') as HTMLElement
    const outer = content.closest('.popup__scroll-container') as HTMLElement
    const list = content.querySelector('.combobox__entries') as HTMLElement
    const header = screen.getByText('Current item').element()
    const footer = screen.getByRole('button', { name: 'Create item' }).element()
    const headerTop = header.getBoundingClientRect().top
    const footerTop = footer.getBoundingClientRect().top

    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
    expect(outer.scrollHeight).toBeLessThanOrEqual(outer.clientHeight)
    expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      outer.getBoundingClientRect().bottom,
    )
    await expect.element(input).toHaveFocus()
    await userEvent.keyboard('{Tab}{End}')
    await expect
      .element(screen.getByRole('menuitem', { name: 'Item 39', exact: true }))
      .toHaveFocus()
    expect(list.scrollTop).toBeGreaterThan(0)
    expect(header.getBoundingClientRect().top).toBe(headerTop)
    expect(footer.getBoundingClientRect().top).toBe(footerTop)
    expect(input.element().getBoundingClientRect().top).toBeGreaterThanOrEqual(
      outer.getBoundingClientRect().top,
    )
  },
)

test.each([
  { theme: 'light', hasEnhancedContrast: false },
  { theme: 'dark', hasEnhancedContrast: false },
  { theme: 'light', hasEnhancedContrast: true },
  { theme: 'dark', hasEnhancedContrast: true },
] as const)(
  'should show search focus in $theme with enhanced contrast $hasEnhancedContrast',
  async ({ theme, hasEnhancedContrast }) => {
    const html = document.documentElement
    const originalTheme = html.getAttribute('data-theme')
    const originalContrast = html.getAttribute('data-enhanced-contrast')

    try {
      html.setAttribute('data-theme', theme)
      html.toggleAttribute('data-enhanced-contrast', hasEnhancedContrast)
      expect(html.hasAttribute('data-enhanced-contrast')).toBe(hasEnhancedContrast)
      const screen = await render(
        <Combobox theme="auto" button="Choose" entries={entries} minEntriesForSearch={0} />,
      )

      await screen.getByRole('button', { name: 'Choose', exact: true }).click()
      const input = screen.getByRole('textbox')

      await expect.element(input).toHaveFocus()
      const searchBar = input.element().closest('.combobox__search-bar') as HTMLElement
      const focusedStyle = getComputedStyle(searchBar)

      expect(focusedStyle.outlineStyle).toBe('solid')
      expect(Number.parseFloat(focusedStyle.outlineWidth)).toBeGreaterThan(0)
      expect(focusedStyle.outlineColor).not.toBe('rgba(0, 0, 0, 0)')
      await userEvent.keyboard('{Tab}')
      expect(getComputedStyle(searchBar).outlineStyle).toBe('none')
    } finally {
      for (const [name, value] of [
        ['data-theme', originalTheme],
        ['data-enhanced-contrast', originalContrast],
      ]) {
        if (value === null) {
          html.removeAttribute(name)
        } else {
          html.setAttribute(name, value)
        }
      }
    }
  },
)
