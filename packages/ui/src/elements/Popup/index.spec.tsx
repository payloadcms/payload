import type { CSSProperties } from 'react'

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

test('should defer a sibling leaf hover state while a submenu is active', async () => {
  const screen = await render(
    <div style={{ '--popup-item-bg-hover': 'rgb(1, 2, 3)' } as CSSProperties}>
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
                />
                <PopupList.Button onClick={() => {}}>Typography</PopupList.Button>
              </PopupList.MenuItem>
            )}
          />
        </PopupList.MenuItem>
      </Popup>
    </div>,
  )

  await screen.getByRole('button', { name: 'Root' }).click()
  await screen.getByRole('menuitem', { name: 'Theme' }).hover()
  const color = screen.getByRole('menuitem', { name: 'Color' })
  await color.hover()
  await expect.element(screen.getByRole('menuitem', { name: 'Light' })).toBeVisible()

  await screen.getByRole('menuitem', { name: 'Typography' }).hover()

  const colorElement = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
    (element) => element.textContent === 'Color',
  )
  const typographyElement = Array.from(
    document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  ).find((element) => element.textContent === 'Typography')

  expect(colorElement?.getAttribute('aria-expanded')).toBe('true')
  expect(getComputedStyle(typographyElement!).backgroundColor).toBe('rgba(0, 0, 0, 0)')

  await expect.element(color).toHaveAttribute('aria-expanded', 'false')
  expect(getComputedStyle(typographyElement!).backgroundColor).toBe('rgb(1, 2, 3)')
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

test('should position a nested menu beside its parent when horizontally aligned right', async () => {
  const screen = await render(
    <Popup button="Root" popupAriaLabel="Root menu" popupType="menu" theme="auto">
      <PopupList.MenuItem>
        <Popup
          renderButton={({ active: _active, ...props }) => (
            <button {...props} type="button">
              Theme
            </button>
          )}
          buttonType="custom"
          hoverSubmenu
          popupAriaLabel="Theme menu"
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
                horizontalAlign="right"
                hoverSubmenu
                popupAriaLabel="Color menu"
                popupType="menu"
                theme="auto"
                render={() => <PopupList.Button onClick={() => {}}>Light</PopupList.Button>}
              />
            </PopupList.MenuItem>
          )}
          side="right"
        />
      </PopupList.MenuItem>
    </Popup>,
  )

  await screen.getByRole('button', { name: 'Root' }).click()
  await screen.getByRole('menuitem', { name: 'Theme' }).hover()
  await screen.getByRole('menuitem', { name: 'Color' }).hover()
  await expect.element(screen.getByRole('menuitem', { name: 'Light' })).toBeVisible()

  const childMenu = document.querySelector<HTMLElement>('[aria-label="Theme menu"]')
  const subchildMenu = document.querySelector<HTMLElement>('[aria-label="Color menu"]')

  expect(childMenu).not.toBeNull()
  expect(subchildMenu).not.toBeNull()
  expect(subchildMenu!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
    childMenu!.getBoundingClientRect().right,
  )
})
