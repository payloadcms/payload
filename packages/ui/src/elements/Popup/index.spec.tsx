import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Popup, PopupList } from './index.js'

test('should preserve ancestor menus while nested hover menus are active', async () => {
  const screen = await render(
    <Popup button="Root" popupType="menu" theme="auto">
      <PopupList.MenuItem>
        <Popup
          renderButton={({ active: _active, ...props }) => (
            <button {...props} type="button">
              Theme
            </button>
          )}
          buttonType="custom"
          hoverSubmenu
          popupType="menu"
          theme="auto"
          render={() => (
            <PopupList.MenuItem>
              <Popup
                renderButton={({ active: _active, ...props }) => (
                  <button {...props} type="button">
                    Color
                  </button>
                )}
                buttonType="custom"
                hoverSubmenu
                popupType="menu"
                theme="auto"
                render={() => <PopupList.Button onClick={() => {}}>Light</PopupList.Button>}
                side="right"
              />
            </PopupList.MenuItem>
          )}
          side="right"
        />
      </PopupList.MenuItem>
    </Popup>,
  )

  await screen.getByRole('button', { name: 'Root' }).click()
  const theme = screen.getByRole('menuitem', { name: 'Theme' })
  await theme.hover()
  const color = screen.getByRole('menuitem', { name: 'Color' })
  await color.hover()

  await expect.element(screen.getByRole('menuitem', { name: 'Light' })).toBeVisible()
  await expect.element(theme).toHaveAttribute('aria-expanded', 'true')
  await expect.element(color).toHaveAttribute('aria-expanded', 'true')
})

test('should open and close nested menus with keyboard focus restoration', async () => {
  const screen = await render(
    <Popup button="Root" popupType="menu" theme="auto">
      <PopupList.MenuItem>
        <Popup
          renderButton={({ active: _active, ...props }) => (
            <button {...props} type="button">
              Theme
            </button>
          )}
          buttonType="custom"
          popupType="menu"
          theme="auto"
          render={() => <PopupList.Button onClick={() => {}}>Light</PopupList.Button>}
        />
      </PopupList.MenuItem>
    </Popup>,
  )

  const root = screen.getByRole('button', { name: 'Root' })
  await root.click()
  const theme = screen.getByRole('menuitem', { name: 'Theme' })
  await theme.click()
  await expect.element(screen.getByRole('menuitem', { name: 'Light' })).toBeVisible()
  await expect.element(theme).toHaveAttribute('aria-expanded', 'true')
})
