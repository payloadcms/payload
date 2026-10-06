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

test('should keep a reusable submenu trigger full width and highlighted over its child menu', async () => {
  const screen = await render(
    <div style={{ '--color-bg-selected-strong': 'rgb(1, 2, 3)' } as CSSProperties}>
      <Popup button="Root" popupType="menu" size="large" theme="auto">
        <PopupList.MenuItem>
          <Popup
            hoverSubmenu
            popupType="menu"
            renderButton={(buttonProps) => (
              <PopupList.SubmenuTrigger
                buttonProps={buttonProps}
                icon={<span aria-hidden="true">◆</span>}
                trailingIcon={<span aria-hidden="true">›</span>}
              >
                Theme
              </PopupList.SubmenuTrigger>
            )}
            side="right"
            theme="auto"
          >
            <PopupList.MenuItem>
              <PopupList.Button onClick={() => {}}>Light</PopupList.Button>
            </PopupList.MenuItem>
          </Popup>
          <PopupList.Button onClick={() => {}}>Account</PopupList.Button>
        </PopupList.MenuItem>
      </Popup>
    </div>,
  )

  await screen.getByRole('button', { name: 'Root' }).click()
  const theme = screen.getByRole('menuitem', { name: 'Theme' })
  const account = screen.getByRole('menuitem', { name: 'Account' })

  expect(Math.round(theme.element().getBoundingClientRect().width)).toBe(
    Math.round(account.element().getBoundingClientRect().width),
  )

  await theme.hover()
  await expect.element(theme).toHaveAttribute('aria-expanded', 'true')
  expect(getComputedStyle(theme.element()).backgroundColor).toBe('rgb(1, 2, 3)')

  await screen.getByRole('menuitem', { name: 'Light' }).hover()
  expect(getComputedStyle(theme.element()).backgroundColor).toBe('rgb(1, 2, 3)')
})

test('should defer hover styling on a submenu trigger in a separate group', async () => {
  const screen = await render(
    <div style={{ '--color-bg-selected-strong': 'rgb(1, 2, 3)' } as CSSProperties}>
      <Popup button="Root" popupType="menu" theme="auto">
        <PopupList.MenuItem>
          <Popup
            hoverSubmenu
            popupType="menu"
            renderButton={(buttonProps) => (
              <PopupList.SubmenuTrigger buttonProps={buttonProps}>Theme</PopupList.SubmenuTrigger>
            )}
            side="left"
            theme="auto"
          >
            <PopupList.MenuItem>
              <PopupList.Button onClick={() => {}}>Light</PopupList.Button>
            </PopupList.MenuItem>
          </Popup>
        </PopupList.MenuItem>
        <PopupList.MenuItem>
          <Popup
            hoverSubmenu
            popupType="menu"
            renderButton={(buttonProps) => (
              <PopupList.SubmenuTrigger buttonProps={buttonProps}>
                Language
              </PopupList.SubmenuTrigger>
            )}
            side="left"
            theme="auto"
          >
            <PopupList.MenuItem>
              <PopupList.Button onClick={() => {}}>English</PopupList.Button>
            </PopupList.MenuItem>
          </Popup>
        </PopupList.MenuItem>
      </Popup>
    </div>,
  )

  await screen.getByRole('button', { name: 'Root' }).click()
  const theme = screen.getByRole('menuitem', { name: 'Theme' })
  const language = screen.getByRole('menuitem', { name: 'Language' })

  await theme.hover()
  await expect.element(theme).toHaveAttribute('aria-expanded', 'true')
  await language.hover()

  expect(theme.element().getAttribute('aria-expanded')).toBe('true')
  expect(getComputedStyle(language.element()).backgroundColor).toBe('rgba(0, 0, 0, 0)')

  await expect.element(language).toHaveAttribute('aria-expanded', 'true')
  expect(getComputedStyle(language.element()).backgroundColor).toBe('rgb(1, 2, 3)')
})

test('should defer hover styling on an action in a separate group', async () => {
  const screen = await render(
    <div style={{ '--popup-item-bg-hover': 'rgb(1, 2, 3)' } as CSSProperties}>
      <Popup button="Root" popupType="menu" theme="auto">
        <PopupList.MenuItem>
          <Popup
            hoverSubmenu
            popupType="menu"
            renderButton={(buttonProps) => (
              <PopupList.SubmenuTrigger buttonProps={buttonProps}>Theme</PopupList.SubmenuTrigger>
            )}
            side="right"
            theme="auto"
          >
            <PopupList.MenuItem>
              <PopupList.Button onClick={() => {}}>Light</PopupList.Button>
            </PopupList.MenuItem>
          </Popup>
        </PopupList.MenuItem>
        <PopupList.MenuItem>
          <PopupList.Button onClick={() => {}}>Account</PopupList.Button>
        </PopupList.MenuItem>
      </Popup>
    </div>,
  )

  await screen.getByRole('button', { name: 'Root' }).click()
  const theme = screen.getByRole('menuitem', { name: 'Theme' })
  const account = screen.getByRole('menuitem', { name: 'Account' })

  await account.hover()
  expect(getComputedStyle(account.element()).backgroundColor).toBe('rgb(1, 2, 3)')

  await theme.hover()
  await expect.element(theme).toHaveAttribute('aria-expanded', 'true')
  await account.hover()

  expect(theme.element().getAttribute('aria-expanded')).toBe('true')
  expect(getComputedStyle(account.element()).backgroundColor).toBe('rgba(0, 0, 0, 0)')
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
          renderButton={(buttonProps) => (
            <PopupList.SubmenuTrigger buttonProps={buttonProps}>Theme</PopupList.SubmenuTrigger>
          )}
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

test('should position a nested menu beside its parent and offset its top by its padding', async () => {
  const screen = await render(
    <div style={{ '--spacer-2': '8px' } as CSSProperties}>
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
      </Popup>
    </div>,
  )

  await screen.getByRole('button', { name: 'Root' }).click()
  await screen.getByRole('menuitem', { name: 'Theme' }).hover()
  const color = screen.getByRole('menuitem', { name: 'Color' })
  await color.hover()
  const light = screen.getByRole('menuitem', { name: 'Light' })
  await expect.element(light).toBeVisible()

  const childMenu = document.querySelector<HTMLElement>('[aria-label="Theme menu"]')
  const subchildMenu = document.querySelector<HTMLElement>('[aria-label="Color menu"]')

  expect(childMenu).not.toBeNull()
  expect(subchildMenu).not.toBeNull()
  expect(subchildMenu!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
    childMenu!.getBoundingClientRect().right,
  )

  const colorElement = subchildMenu!.parentElement!.querySelector<HTMLElement>(
    ':scope > .popup__trigger-wrap [role="menuitem"]',
  )

  expect(Math.round(subchildMenu!.getBoundingClientRect().top)).toBe(
    Math.round(colorElement!.getBoundingClientRect().top - 8),
  )
})
