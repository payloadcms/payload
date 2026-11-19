import type { CSSProperties, ReactNode } from 'react'

import type { PopupProps } from './index.js'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import { describe, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import {
  expectFocus,
  PopupTestRoot,
} from '../../../../../test/__helpers/components/PopupTestRoot/index.js'
import { useTheme } from '../../providers/Theme/index.js'
import { Popup, PopupList } from './index.js'

describe('document', () => runPopupTests({ isShadowRoot: false }))
describe('shadow root', () => runPopupTests({ isShadowRoot: true }))

function runPopupTests({ isShadowRoot }: { isShadowRoot: boolean }) {
  function Root({ children }: { children: ReactNode }) {
    return <PopupTestRoot isShadowRoot={isShadowRoot}>{children}</PopupTestRoot>
  }

  test('should inset menu items from the panel edges', async () => {
    const screen = await render(
      <PopupTestRoot isShadowRoot={isShadowRoot} shouldLoadBaseStyles={false}>
        <Popup button="Actions" popupAriaLabel="Actions menu" popupType="menu">
          <PopupList.ButtonGroup>
            <PopupList.Button onClick={() => {}}>Select</PopupList.Button>
          </PopupList.ButtonGroup>
        </Popup>
      </PopupTestRoot>,
    )

    await screen.getByRole('button', { name: 'Actions', exact: true }).click()
    const menu = screen.getByRole('menu', { name: 'Actions menu' })
    const option = screen.getByRole('menuitem', { name: 'Select', exact: true })

    await expect
      .poll(() => {
        const menuElement = menu.element()
        const menuBox = menuElement.getBoundingClientRect()
        const optionBox = option.element().getBoundingClientRect()

        return {
          leftInset: optionBox.left - menuBox.left,
          padding: getComputedStyle(menuElement).padding,
          topInset: optionBox.top - menuBox.top,
        }
      })
      .toEqual({ leftInset: 8, padding: '0px', topInset: 8 })
  })

  test('should return focus to the submenu trigger when hovering a sibling item', async () => {
    const screen = await render(
      <Popup button="Actions" popupType="menu">
        <PopupList.MenuItem>
          <Popup button="More actions" hoverSubmenu popupType="menu">
            <div data-popup-prevent-close>
              <PopupTestRoot isShadowRoot>
                <input aria-label="Nested draft" />
              </PopupTestRoot>
            </div>
          </Popup>
          <PopupList.Button onClick={() => {}}>Sibling action</PopupList.Button>
        </PopupList.MenuItem>
      </Popup>,
      { wrapper: Root },
    )

    await screen.getByRole('button', { name: 'Actions', exact: true }).click()
    const nested = screen.getByRole('menuitem', { name: 'More actions', exact: true })

    await nested.hover()
    await screen.getByRole('textbox', { name: 'Nested draft' }).fill('Unsaved draft')
    await screen.getByRole('menuitem', { name: 'Sibling action', exact: true }).hover()
    await expect.element(nested).toHaveAttribute('aria-expanded', 'false')
    await expectFocus({ locator: nested })
  })

  test('should keep the popup open while interacting with its controls', async () => {
    const onSelect = vi.fn()
    const screen = await render(
      <Popup button="Controls" popupType="dialog">
        <div data-popup-prevent-close>
          <PopupTestRoot isShadowRoot>
            <button onClick={onSelect} type="button">
              Nested control
            </button>
            <input aria-label="Nested draft" />
          </PopupTestRoot>
        </div>
      </Popup>,
      { wrapper: Root },
    )
    const trigger = screen.getByRole('button', { name: 'Controls', exact: true })

    await trigger.click()
    await screen.getByRole('button', { name: 'Nested control', exact: true }).click()
    expect(onSelect).toHaveBeenCalledOnce()
    await screen.getByRole('textbox', { name: 'Nested draft' }).fill('Unsaved draft')
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(screen.getByRole('textbox', { name: 'Nested draft' }))
      .toHaveValue('Unsaved draft')
  })

  test('should activate a menu action', async () => {
    const onSelect = vi.fn()
    const screen = await render(
      <>
        <Popup button="Actions" popupType="menu">
          <PopupList.Button onClick={onSelect}>Select</PopupList.Button>
        </Popup>
        <button type="button">Outside menu</button>
      </>,
      { wrapper: Root },
    )

    await screen.getByRole('button', { name: 'Actions', exact: true }).click()
    await screen.getByRole('menuitem', { name: 'Select', exact: true }).click()

    expect(onSelect).toHaveBeenCalledOnce()
  })

  test('should navigate menu items with the keyboard', async () => {
    const screen = await render(
      <Popup button="Actions" popupType="menu">
        <PopupList.ButtonGroup>
          {['First', 'Second', 'Third'].map((label) => (
            <PopupList.Button key={label} onClick={() => {}}>
              {label}
            </PopupList.Button>
          ))}
        </PopupList.ButtonGroup>
      </Popup>,
      { wrapper: Root },
    )
    const trigger = screen.getByRole('button', { name: 'Actions', exact: true })

    trigger.element().focus()
    await userEvent.keyboard('{Enter}')
    await expectFocus({ locator: screen.getByRole('menuitem', { name: 'First' }) })
    await userEvent.keyboard('{ArrowDown}')
    await expectFocus({ locator: screen.getByRole('menuitem', { name: 'Second' }) })
    await userEvent.keyboard('{End}')
    await expectFocus({ locator: screen.getByRole('menuitem', { name: 'Third' }) })
    await userEvent.keyboard('{Home}{ArrowUp}')
    await expectFocus({ locator: screen.getByRole('menuitem', { name: 'Third' }) })
    await userEvent.keyboard('{Escape}')
    await expectFocus({ locator: trigger })
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('should navigate past a focused embedded control', async () => {
    const screen = await render(
      <Popup button="Actions" popupType="dialog">
        <button type="button">First</button>
        <PopupTestRoot isShadowRoot tabIndex={0}>
          <button type="button">Embedded control</button>
        </PopupTestRoot>
        <button type="button">Last</button>
      </Popup>,
      { wrapper: Root },
    )
    const embedded = screen.getByRole('button', { name: 'Embedded control' })

    await screen.getByRole('button', { name: 'Actions', exact: true }).click()
    embedded.element().focus()
    await expectFocus({ locator: embedded })
    await userEvent.keyboard('{ArrowDown}')
    await expectFocus({ locator: screen.getByRole('button', { name: 'Last', exact: true }) })

    embedded.element().focus()
    await userEvent.keyboard('{ArrowUp}')
    await expectFocus({ locator: screen.getByRole('button', { name: 'First', exact: true }) })
  })

  test('should return focus to the submenu trigger on Escape', async () => {
    const screen = await render(
      <Popup button="Actions" popupType="menu">
        <Popup button="More actions" popupType="menu">
          <PopupList.Button onClick={() => {}}>Nested action</PopupList.Button>
        </Popup>
      </Popup>,
      { wrapper: Root },
    )
    const trigger = screen.getByRole('button', { name: 'Actions', exact: true })

    trigger.element().focus()
    await userEvent.keyboard('{Enter}')
    const nested = screen.getByRole('menuitem', { name: 'More actions', exact: true })

    await expectFocus({ locator: nested })
    await userEvent.keyboard('{ArrowRight}')
    await expectFocus({ locator: screen.getByRole('menuitem', { name: 'Nested action' }) })
    await userEvent.keyboard('{Escape}')
    await expectFocus({ locator: nested })
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect.element(nested).toHaveAttribute('aria-expanded', 'false')
  })

  test('should close each menu once when tabbing out', async () => {
    const onClose = vi.fn()
    const screen = await render(
      <Popup button="Actions" onToggleClose={onClose} popupType="menu">
        <Popup button="More actions" popupType="menu">
          <div data-popup-prevent-close>
            <PopupTestRoot isShadowRoot>
              <input aria-label="Nested draft" />
            </PopupTestRoot>
          </div>
        </Popup>
      </Popup>,
      { wrapper: Root },
    )
    const trigger = screen.getByRole('button', { name: 'Actions', exact: true })

    await trigger.click()
    await screen.getByRole('menuitem', { name: 'More actions', exact: true }).click()
    await screen.getByRole('textbox', { name: 'Nested draft' }).fill('Unsaved draft')
    await userEvent.keyboard('{Tab}')
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
    // Flush the queued close callbacks before counting them.
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    expect(onClose).toHaveBeenCalledOnce()
  })

  test('should keep the menu aligned with its trigger when scrolling', async () => {
    const screen = await render(
      <div data-testid="scroll-container" style={{ height: 240, overflow: 'auto' }}>
        <div style={{ height: 800, padding: 64 }}>
          <div style={{ display: 'flex', height: 24 }}>
            <Popup button="Actions" popupAriaLabel="Actions menu" popupType="menu">
              <PopupList.Button onClick={() => {}}>Select</PopupList.Button>
            </Popup>
          </div>
        </div>
      </div>,
      { wrapper: Root },
    )
    const trigger = screen.getByRole('button', { name: 'Actions', exact: true })

    await trigger.click()
    const menu = screen.getByRole('menu', { name: 'Actions menu' })
    const getGap = () =>
      Math.round(
        menu.element().getBoundingClientRect().top -
          trigger.element().getBoundingClientRect().bottom,
      )

    await expect.poll(getGap).toBe(8)
    screen.getByTestId('scroll-container').element().scrollTop = 32
    await expect.poll(getGap).toBe(8)
  })

  test('should close when clicking outside the popup', async () => {
    const screen = await render(
      <>
        <Popup button="Actions" popupType="menu">
          <PopupList.Button onClick={() => {}}>Select</PopupList.Button>
        </Popup>
        <button style={{ position: 'fixed', right: 16, top: 16 }} type="button">
          Inside test root
        </button>
        {createPortal(
          <button style={{ position: 'fixed', right: 16, top: 64 }} type="button">
            Outside test root
          </button>,
          document.body,
        )}
      </>,
      { wrapper: Root },
    )
    const trigger = screen.getByRole('button', { name: 'Actions', exact: true })

    for (const name of ['Inside test root', 'Outside test root']) {
      await trigger.click()
      await expect.element(trigger).toHaveAttribute('aria-expanded', 'true')
      await screen.getByRole('button', { name, exact: true }).click()
      await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
    }
  })

  describe.each([
    { context: 'without root hit testing', hasRootHitTesting: false },
    { context: 'with root hit testing', hasRootHitTesting: true },
  ])('$context', ({ hasRootHitTesting }) => {
    test('should close a submenu after the pointer stops moving', async () => {
      await page.viewport(1000, 720)
      const screen = await render(
        <div
          data-testid="pointer-surface"
          style={{ inset: 0, padding: '64px 300px', position: 'fixed' }}
        >
          <Popup button="Actions" popupType="menu" size="large">
            <PopupList.MenuItem>
              {['Theme', 'Language'].map((label) => (
                <Popup
                  hoverSubmenu
                  key={label}
                  popupAriaLabel={`${label} menu`}
                  popupType="menu"
                  renderButton={(buttonProps) => (
                    <PopupList.SubmenuTrigger buttonProps={buttonProps}>
                      {label}
                    </PopupList.SubmenuTrigger>
                  )}
                  size="large"
                >
                  <PopupList.ButtonGroup>
                    {[1, 2, 3].map((option) => (
                      <PopupList.Button
                        key={option}
                        onClick={() => {}}
                      >{`${label} option ${option}`}</PopupList.Button>
                    ))}
                  </PopupList.ButtonGroup>
                </Popup>
              ))}
            </PopupList.MenuItem>
          </Popup>
        </div>,
        { wrapper: Root },
      )
      const trigger = screen.getByRole('button', { name: 'Actions', exact: true })
      const root = trigger.element().getRootNode()

      if (isShadowRoot && !hasRootHitTesting) {
        Object.defineProperty(root, 'elementFromPoint', { value: undefined })
      }

      await trigger.click()
      const theme = screen.getByRole('menuitem', { name: 'Theme', exact: true })
      const language = screen.getByRole('menuitem', { name: 'Language', exact: true })

      await theme.hover()
      await expect.element(theme).toHaveAttribute('aria-expanded', 'true')
      const triggerBox = theme.element().getBoundingClientRect()
      const siblingBox = language.element().getBoundingClientRect()
      const menuBox = screen
        .getByRole('menu', { name: 'Theme menu' })
        .element()
        .getBoundingClientRect()
      const startX = triggerBox.left + triggerBox.width / 2
      const startY = triggerBox.top + triggerBox.height / 2
      const targetX = startX + (menuBox.left - startX) * 0.85
      const targetY = siblingBox.top + siblingBox.height / 2
      await userEvent.hover(screen.getByTestId('pointer-surface'), {
        force: true,
        position: { x: targetX, y: targetY },
      })

      await expect.element(theme).toHaveAttribute('aria-expanded', 'true')
      await expect.element(language).toHaveAttribute('aria-expanded', 'false')
      await expect.element(theme).toHaveAttribute('aria-expanded', 'false')
      await expect
        .element(language)
        .toHaveAttribute('aria-expanded', String(hasRootHitTesting || !isShadowRoot))
      await expect.element(trigger).toHaveAttribute('aria-expanded', 'true')
    })
  })

  test.each([
    { direction: 'left', side: 'left', width: 1000 },
    { direction: 'right', side: 'right', width: 1000 },
    { direction: 'left after flipping', side: 'right', width: 414 },
  ] as const)(
    'should protect fine diagonal movement toward a submenu opening to the $direction',
    async ({ direction, side, width }) => {
      await page.viewport(width, 720)

      const onOpenLanguage = vi.fn()
      const screen = await render(
        <div
          data-testid="pointer-surface"
          style={{ inset: 0, padding: '64px 300px', position: 'fixed' }}
        >
          <Popup button="Root" popupType="menu" size="large" theme="auto">
            <PopupList.MenuItem>
              {['Theme', 'Language'].map((label) => (
                <Popup
                  hoverSubmenu
                  key={label}
                  onToggleOpen={label === 'Language' ? onOpenLanguage : undefined}
                  popupAriaLabel={`${label} menu`}
                  popupType="menu"
                  renderButton={(buttonProps) => (
                    <PopupList.SubmenuTrigger buttonProps={buttonProps}>
                      {label}
                    </PopupList.SubmenuTrigger>
                  )}
                  side={side}
                  theme="auto"
                >
                  <div data-popup-prevent-close>
                    {Array.from({ length: 3 }, (_, index) => (
                      <PopupList.Button key={index} onClick={() => {}}>
                        {`${label} option ${index}`}
                      </PopupList.Button>
                    ))}
                  </div>
                </Popup>
              ))}
            </PopupList.MenuItem>
          </Popup>
        </div>,
        { wrapper: Root },
      )

      await screen.getByRole('button', { name: 'Root' }).click()
      const theme = screen.getByRole('menuitem', { name: 'Theme', exact: true })
      const language = screen.getByRole('menuitem', { name: 'Language', exact: true })

      await theme.hover()
      await expect.element(theme).toHaveAttribute('aria-expanded', 'true')

      const triggerBox = theme.element().getBoundingClientRect()
      const siblingBox = language.element().getBoundingClientRect()
      const menuBox = screen
        .getByRole('menu', { name: 'Theme menu' })
        .element()
        .getBoundingClientRect()
      const startX = triggerBox.left + triggerBox.width / 2
      const isOnLeft = direction.startsWith('left')
      const edgeX = isOnLeft ? menuBox.right : menuBox.left
      const diagonalPoint = {
        x: startX + (edgeX - startX) * 0.85,
        y: siblingBox.top + siblingBox.height / 2,
      }

      expect(isOnLeft ? menuBox.right < startX : menuBox.left > startX).toBe(true)

      const startY = triggerBox.top + triggerBox.height / 2
      const steps = Math.ceil(Math.abs(diagonalPoint.x - startX))

      // Keep moving by at most one horizontal pixel per event. Crossing the safe
      // area can take longer than the 300 ms pause timeout.
      for (let step = 1; step <= steps; step++) {
        await userEvent.hover(screen.getByTestId('pointer-surface'), {
          force: true,
          position: {
            x: startX + ((diagonalPoint.x - startX) * step) / steps,
            y: startY + ((diagonalPoint.y - startY) * step) / steps,
          },
        })
      }
      const root = language.element().getRootNode() as Document | ShadowRoot
      expect(root.elementFromPoint(diagonalPoint.x, diagonalPoint.y)).toBe(language.element())
      await expect.element(theme).toHaveAttribute('aria-expanded', 'true')
      await expect.element(language).toHaveAttribute('aria-expanded', 'false')

      const option = screen.getByRole('menuitem', { name: 'Theme option 2' })
      await option.click()
      const optionBox = option.element().getBoundingClientRect()
      const returnX = optionBox.left + optionBox.width / 2
      const returnY = optionBox.top + optionBox.height / 2
      for (let step = 1; step <= steps; step++) {
        await userEvent.hover(screen.getByTestId('pointer-surface'), {
          force: true,
          position: {
            x: returnX + ((startX - returnX) * step) / steps,
            y: returnY + ((startY - returnY) * step) / steps,
          },
        })
      }
      expect(onOpenLanguage).not.toHaveBeenCalled()
      await expect.element(theme).toHaveAttribute('aria-expanded', 'true')

      // A deliberate click still reaches the row inside the safe area.
      await userEvent.hover(screen.getByTestId('pointer-surface'), {
        force: true,
        position: diagonalPoint,
      })
      await language.click({
        position: {
          x: diagonalPoint.x - siblingBox.left,
          y: diagonalPoint.y - siblingBox.top,
        },
      })
      await expect.element(language).toHaveAttribute('aria-expanded', 'true')
    },
  )

  test('should preserve ancestor menus while nested hover menus are active', async () => {
    const screen = await render(
      <NestedMenuFixture side="right" submenuProps={{ side: 'right' }} />,
      { wrapper: Root },
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
      { wrapper: Root },
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

  test('should switch siblings with the latest callbacks after a rerender', async () => {
    const renderMenu = ({ onClose }: { onClose: () => void }) => (
      <div style={{ '--color-bg-selected-strong': 'rgb(1, 2, 3)' } as CSSProperties}>
        <Popup button="Root" popupType="menu" theme="auto">
          <PopupList.MenuItem>
            <Popup
              hoverSubmenu
              onToggleClose={() => onClose()}
              onToggleOpen={() => {}}
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
      </div>
    )
    const initialClose = vi.fn()
    const latestClose = vi.fn()
    const screen = await render(renderMenu({ onClose: initialClose }), { wrapper: Root })

    await screen.getByRole('button', { name: 'Root' }).click()
    const theme = screen.getByRole('menuitem', { name: 'Theme' })
    const language = screen.getByRole('menuitem', { name: 'Language' })

    await theme.hover()
    await expect.element(theme).toHaveAttribute('aria-expanded', 'true')
    await screen.rerender(renderMenu({ onClose: latestClose }))
    language.element().focus()
    await userEvent.keyboard('{Enter}')

    expect(theme.element().getAttribute('aria-expanded')).toBe('false')
    expect(language.element().getAttribute('aria-expanded')).toBe('true')
    expect(initialClose).not.toHaveBeenCalled()
    expect(latestClose).toHaveBeenCalledOnce()

    await expect.element(language).toHaveAttribute('aria-expanded', 'true')
    expect(getComputedStyle(language.element()).backgroundColor).toBe('rgb(1, 2, 3)')
  })

  test('should immediately close a hover submenu over a sibling action', async () => {
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
      { wrapper: Root },
    )

    await screen.getByRole('button', { name: 'Root' }).click()
    const theme = screen.getByRole('menuitem', { name: 'Theme' })
    const account = screen.getByRole('menuitem', { name: 'Account' })

    await account.hover()
    expect(getComputedStyle(account.element()).backgroundColor).toBe('rgb(1, 2, 3)')

    await theme.hover()
    await expect.element(theme).toHaveAttribute('aria-expanded', 'true')
    await account.hover()

    expect(theme.element().getAttribute('aria-expanded')).toBe('false')
    expect(getComputedStyle(account.element()).backgroundColor).toBe('rgb(1, 2, 3)')
  })

  test('should immediately hand hover back to a sibling leaf', async () => {
    const screen = await render(
      <div style={{ '--popup-item-bg-hover': 'rgb(1, 2, 3)' } as CSSProperties}>
        <NestedMenuFixture>
          <PopupList.Button onClick={() => {}}>Typography</PopupList.Button>
        </NestedMenuFixture>
      </div>,
      { wrapper: Root },
    )

    await screen.getByRole('button', { name: 'Root' }).click()
    await screen.getByRole('menuitem', { name: 'Theme' }).hover()
    const color = screen.getByRole('menuitem', { name: 'Color' })
    await color.hover()
    await expect.element(screen.getByRole('menuitem', { name: 'Light' })).toBeVisible()

    await screen.getByRole('menuitem', { name: 'Typography' }).hover()

    const colorElement = color.element()
    const typographyElement = screen.getByRole('menuitem', { name: 'Typography' }).element()

    expect(colorElement?.getAttribute('aria-expanded')).toBe('false')

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
      { wrapper: Root },
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
        <NestedMenuFixture side="right" submenuProps={{ horizontalAlign: 'right' }} />
      </div>,
      { wrapper: Root },
    )

    await screen.getByRole('button', { name: 'Root' }).click()
    await screen.getByRole('menuitem', { name: 'Theme' }).hover()
    const color = screen.getByRole('menuitem', { name: 'Color' })
    await color.hover()
    const light = screen.getByRole('menuitem', { name: 'Light' })
    await expect.element(light).toBeVisible()

    const childMenu = screen.getByRole('menu', { name: 'Theme menu' }).element()
    const subchildMenu = screen.getByRole('menu', { name: 'Color menu' }).element()

    expect(childMenu).not.toBeNull()
    expect(subchildMenu).not.toBeNull()
    expect(subchildMenu!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      childMenu!.getBoundingClientRect().right,
    )

    const colorElement = screen.getByRole('menuitem', { name: 'Color', exact: true }).element()

    expect(Math.round(subchildMenu!.getBoundingClientRect().top)).toBe(
      Math.round(colorElement!.getBoundingClientRect().top - 8),
    )
  })

  test('should update only the popup theme and preserve its draft when the theme prop changes', async () => {
    const originalTheme = document.documentElement.getAttribute('data-theme')
    const themeContexts: ReturnType<typeof useTheme>[] = []

    function ThemeControls() {
      const context = useTheme()
      const { setTheme, theme } = context

      useEffect(() => {
        themeContexts.push(context)
      }, [context])

      return (
        <div data-popup-prevent-close>
          <output aria-label="Popup theme">{theme}</output>
          <input aria-label="Popup draft" />
          <button onClick={() => setTheme('light')} type="button">
            Set popup light
          </button>
        </div>
      )
    }

    const screen = await render(
      <Popup button="Open theme scope" theme="dark">
        <ThemeControls />
      </Popup>,
      { wrapper: Root },
    )

    await screen.getByRole('button', { name: 'Open theme scope' }).click()
    expect(themeContexts).toHaveLength(1)
    await expect.element(screen.getByLabelText('Popup theme')).toHaveTextContent('dark')
    expect(() => {
      // @ts-expect-error Automatic mode is a root preference.
      themeContexts[0]!.setTheme('auto')
    }).toThrow(/useRootTheme/)
    await expect.element(screen.getByLabelText('Popup theme')).toHaveTextContent('dark')
    await screen.getByRole('button', { name: 'Set popup light' }).click()
    await expect.element(screen.getByLabelText('Popup theme')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe(originalTheme)

    const draft = screen.getByRole('textbox', { name: 'Popup draft' })

    screen
      .getByLabelText('Popup theme')
      .element()
      .closest('[popover]')!
      .setAttribute('data-theme', 'dark')
    await draft.fill('Unsaved popup draft')
    await draft.click()
    await expect.element(screen.getByLabelText('Popup theme')).toHaveTextContent('light')
    await screen.rerender(
      <Popup button="Open theme scope" theme="auto">
        <ThemeControls />
      </Popup>,
    )
    await expect.element(draft).toHaveValue('Unsaved popup draft')
    await expectFocus({ locator: draft })
    await screen.rerender(
      <Popup button="Open theme scope" theme="dark">
        <ThemeControls />
      </Popup>,
    )
    await expect.element(screen.getByLabelText('Popup theme')).toHaveTextContent('dark')
    await expect.element(draft).toHaveValue('Unsaved popup draft')
    await expectFocus({ locator: draft })
  })
}

function NestedMenuFixture({
  children,
  side,
  submenuProps,
}: {
  children?: ReactNode
  side?: PopupProps['side']
  submenuProps?: Pick<PopupProps, 'horizontalAlign' | 'side'>
}) {
  return (
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
          side={side}
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
                popupAriaLabel="Color menu"
                popupType="menu"
                theme="auto"
                render={() => <PopupList.Button onClick={() => {}}>Light</PopupList.Button>}
                {...submenuProps}
              />
              {children}
            </PopupList.MenuItem>
          )}
        />
      </PopupList.MenuItem>
    </Popup>
  )
}
