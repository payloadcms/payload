import type { ButtonHTMLAttributes } from 'react'

import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { PopupTrigger } from './index.js'

test('should use a custom button as the only interactive popup trigger', async () => {
  // Additional coverage for PYLD-3645 and PYLD-3697.
  const setActive = vi.fn()
  const screen = await render(
    <PopupTrigger
      active={false}
      button={<button type="button">Open options</button>}
      buttonType="custom"
      contentId="popup-content"
      popupType="menu"
      setActive={setActive}
    />,
  )

  const trigger = screen.getByRole('button', { name: 'Open options' })

  expect(screen.getByRole('button').all()).toHaveLength(1)
  await expect.element(trigger).toHaveAttribute('aria-controls', 'popup-content')
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
  await trigger.click()
  expect(setActive).toHaveBeenCalledWith(true, false)
})

test('should activate when a custom button prevents its click default', async () => {
  // Additional coverage for PYLD-3645 and PYLD-3697.
  const setActive = vi.fn()
  const screen = await render(
    <PopupTrigger
      active={false}
      button={<PreventingButton>Open options</PreventingButton>}
      buttonType="custom"
      contentId="popup-content"
      popupType="menu"
      setActive={setActive}
    />,
  )

  await screen.getByRole('button', { name: 'Open options' }).click()
  expect(setActive).toHaveBeenCalledWith(true, false)
})

function PreventingButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      onClick={(event) => {
        event.preventDefault()
        props.onClick?.(event)
      }}
      type="button"
    />
  )
}
