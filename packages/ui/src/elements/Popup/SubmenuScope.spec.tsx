import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import type { PopupButtonRenderProps } from './PopupTrigger/index.js'

import '../../css/app.css'
import { Popup, PopupList } from './index.js'

type Point = { x: number; y: number }

type PointerMove = { time: number } & Point

type Toggle = { label: string; state: 'close' | 'open'; time: number }

const EVENT_INTERVAL_MS = 16
const SETTLE_MS = 150
const SUBMENUS = ['Theme', 'Language', 'Settings']
const ITEM_NAMES = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight']
const SPEEDS = [
  { name: 'slow', step: 1 },
  { name: 'medium', step: 4 },
  { name: 'fast', step: 12 },
]

const Icon = () => <svg aria-hidden="true" height={24} width={24} />

const SubmenuTrigger = ({
  buttonProps,
  label,
}: {
  buttonProps: PopupButtonRenderProps
  label: string
}) => (
  <PopupList.SubmenuTrigger buttonProps={buttonProps} icon={<Icon />} trailingIcon={<Icon />}>
    {label}
  </PopupList.SubmenuTrigger>
)

const renderUserMenu = async ({
  clickOnly = [],
  customTriggers = [],
  itemCounts = {},
  nestedSubmenu,
  paddingInlineStart = 100,
  side = 'right',
}: {
  clickOnly?: string[]
  customTriggers?: string[]
  itemCounts?: Record<string, number>
  nestedSubmenu?: { label: string; parent: string }
  paddingInlineStart?: number
  side?: 'left' | 'right'
} = {}) => {
  await page.viewport(800, 600)

  const changes: string[] = []
  const moves: PointerMove[] = []
  const toggles: Toggle[] = []
  const observer = new MutationObserver((records) => {
    for (const { target } of records) {
      if (target instanceof HTMLElement) {
        changes.push(`${target.textContent} ${target.getAttribute('aria-expanded')}`)
      }
    }
  })
  const recordMove = (event: PointerEvent) =>
    moves.push({ time: performance.now(), x: event.clientX, y: event.clientY })
  const toggleProps = (label: string) => ({
    onToggleClose: vi.fn(() => toggles.push({ label, state: 'close', time: performance.now() })),
    onToggleOpen: vi.fn(() => toggles.push({ label, state: 'open', time: performance.now() })),
  })

  const renderItems = (label: string) => (
    <PopupList.MenuItem>
      {nestedSubmenu?.parent === label ? (
        <Popup
          {...toggleProps(nestedSubmenu.label)}
          hoverSubmenu
          popupAriaLabel={`${nestedSubmenu.label} menu`}
          popupType="menu"
          renderButton={(buttonProps) => (
            <SubmenuTrigger buttonProps={buttonProps} label={nestedSubmenu.label} />
          )}
          side="right"
          size="large"
          theme="auto"
        >
          {renderItems(nestedSubmenu.label)}
        </Popup>
      ) : null}
      {ITEM_NAMES.slice(0, itemCounts[label] ?? 3).map((item) => (
        <PopupList.Button key={item} onClick={() => {}}>{`${label} ${item}`}</PopupList.Button>
      ))}
    </PopupList.MenuItem>
  )

  const renderTree = ({ submenus = SUBMENUS }: { submenus?: string[] } = {}) => (
    <div style={{ padding: 100, paddingInlineStart }}>
      <Popup
        button="Account"
        caret={false}
        popupAriaLabel="Account menu"
        popupType="menu"
        size="large"
        theme="auto"
      >
        <PopupList.MenuItem>
          <PopupList.Button onClick={() => {}}>Profile</PopupList.Button>
        </PopupList.MenuItem>
        {submenus.map((label) => (
          <PopupList.MenuItem key={label}>
            <Popup
              {...toggleProps(label)}
              hoverSubmenu={!clickOnly.includes(label)}
              popupAriaLabel={`${label} menu`}
              popupType="menu"
              renderButton={({ active: _active, ...buttonProps }) =>
                customTriggers.includes(label) ? (
                  <div {...buttonProps}>{label}</div>
                ) : (
                  <SubmenuTrigger buttonProps={{ active: _active, ...buttonProps }} label={label} />
                )
              }
              side={side}
              size="large"
              theme="auto"
            >
              {renderItems(label)}
            </Popup>
          </PopupList.MenuItem>
        ))}
        <PopupList.MenuItem>
          <PopupList.Button onClick={() => {}}>Log out</PopupList.Button>
        </PopupList.MenuItem>
      </Popup>
    </div>
  )
  const screen = await render(renderTree())

  await screen.getByRole('button', { name: 'Account' }).click()
  observer.observe(document.body, { attributeFilter: ['aria-expanded'], subtree: true })
  document.addEventListener('pointermove', recordMove, { capture: true })
  onTestFinished(() => {
    observer.disconnect()
    document.removeEventListener('pointermove', recordMove, { capture: true })
  })

  const item = (name: string) => screen.getByRole('menuitem', { exact: true, name })
  const rectOf = (name: string) => item(name).element().getBoundingClientRect()
  const menuOf = (name: string) => screen.getByRole('menu', { name: `${name} menu` })
  const menuRectOf = (name: string) => menuOf(name).element().getBoundingClientRect()
  const centerOf = (name: string) => {
    const rect = rectOf(name)

    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }
  const toggleLog = () => toggles.map(({ label, state }) => `${label} ${state}`)
  const toggleTime = (entry: string) =>
    toggles.find((toggle) => `${toggle.label} ${toggle.state}` === entry)?.time

  return {
    centerOf,
    changes,
    rerender: (options: { submenus?: string[] } = {}) => screen.rerender(renderTree(options)),
    unmount: () => screen.unmount(),
    item,
    menuOf,
    menuRectOf,
    moves,
    rectOf,
    toggleLog,
    toggleTime,
    toggles,
  }
}

const pointsBetween = ({ from, step, to }: { from: Point; step: number; to: Point }): Point[] => {
  const count = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / step))

  return Array.from({ length: count }, (_, index) => ({
    x: from.x + ((to.x - from.x) * (index + 1)) / count,
    y: from.y + ((to.y - from.y) * (index + 1)) / count,
  }))
}

const movePointer = ({
  intervalMs = EVENT_INTERVAL_MS,
  points,
  pointerType,
  shouldClickAtEnd,
}: {
  intervalMs?: number
  points: Point[]
  pointerType?: 'mouse' | 'pen'
  shouldClickAtEnd?: boolean
}) => commands.movePointer({ intervalMs, pointerType, points, shouldClickAtEnd })

const hoverSubmenu = async ({
  menu,
  name,
}: {
  menu: Awaited<ReturnType<typeof renderUserMenu>>
  name: string
}) => {
  const start = { x: menu.rectOf(name).left + 30, y: menu.centerOf(name).y }

  await movePointer({ points: [start] })
  await expect.element(menu.menuOf(name)).toBeVisible()

  return start
}

const settle = () => new Promise((resolve) => setTimeout(resolve, SETTLE_MS))

const isInRect = ({ point, rect }: { point: Point; rect: DOMRect }) =>
  point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom

const waitForPointer = ({ isReady }: { isReady: () => boolean }) =>
  new Promise<void>((resolve) => {
    const check = () => (isReady() ? resolve() : requestAnimationFrame(check))

    check()
  })

test('should open a hovered submenu at once and hand over to the sibling straight below', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const languageRect = menu.rectOf('Language')

  await movePointer({
    points: pointsBetween({ from: start, step: 4, to: { x: start.x, y: languageRect.bottom - 4 } }),
  })
  await settle()

  const firstMoveOverLanguage = menu.moves.findIndex((move) =>
    isInRect({ point: move, rect: languageRect }),
  )

  expect(menu.changes).toEqual(['Theme true', 'Theme false', 'Language true'])
  expect(menu.toggleLog()).toEqual(['Theme open', 'Theme close', 'Language open'])
  expect(menu.toggleTime('Language open')).toBeLessThan(menu.moves[firstMoveOverLanguage + 1].time)
})

test('should close the open submenu as soon as a plain item is hovered', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })

  await movePointer({
    points: pointsBetween({ from: start, step: 4, to: menu.centerOf('Profile') }),
  })
  await settle()

  expect(menu.changes).toEqual(['Theme true', 'Theme false'])
  expect(menu.toggleLog()).toEqual(['Theme open', 'Theme close'])
})

describe.each(SPEEDS)('at $name speed', ({ step }) => {
  test('should keep the submenu while heading into it across sibling rows', async () => {
    const menu = await renderUserMenu()
    const start = await hoverSubmenu({ menu, name: 'Theme' })
    const target = { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y }

    await movePointer({ points: pointsBetween({ from: start, step, to: target }) })
    await settle()

    expect(menu.changes).toEqual(['Theme true'])
    expect(menu.toggleLog()).toEqual(['Theme open'])
  })

  test('should keep the submenu while heading back to its trigger across sibling rows', async () => {
    const menu = await renderUserMenu()
    const start = await hoverSubmenu({ menu, name: 'Theme' })
    const inside = { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y }
    const trigger = { x: menu.rectOf('Theme').right - 20, y: start.y }

    await movePointer({ points: pointsBetween({ from: start, step: 12, to: inside }) })
    await settle()
    await movePointer({ points: pointsBetween({ from: inside, step, to: trigger }) })
    await settle()

    expect(menu.changes).toEqual(['Theme true'])
    expect(menu.toggleLog()).toEqual(['Theme open'])
  })
})

describe('on a slow diagonal at 1px every 21ms', () => {
  test('should keep the submenu while heading into it', { timeout: 20_000 }, async () => {
    const menu = await renderUserMenu({ itemCounts: { Language: 8 } })

    await hoverSubmenu({ menu, name: 'Language' })

    const start = { x: menu.rectOf('Language').right - 30, y: menu.centerOf('Language').y }
    const target = {
      x: menu.menuRectOf('Language').left + 24,
      y: menu.centerOf('Language Eight').y,
    }

    await movePointer({ points: [start] })
    await movePointer({
      intervalMs: 21,
      points: pointsBetween({ from: start, step: 1, to: target }),
    })
    await settle()

    expect(menu.changes).toEqual(['Language true'])
    expect(menu.toggleLog()).toEqual(['Language open'])
  })

  test(
    'should keep the submenu while heading back to its trigger',
    { timeout: 20_000 },
    async () => {
      const menu = await renderUserMenu({ itemCounts: { Language: 8 } })
      const start = await hoverSubmenu({ menu, name: 'Language' })
      const inside = {
        x: menu.menuRectOf('Language').left + 24,
        y: menu.centerOf('Language Eight').y,
      }

      await movePointer({ points: pointsBetween({ from: start, step: 12, to: inside }) })
      await settle()
      await movePointer({
        intervalMs: 21,
        points: pointsBetween({ from: inside, step: 1, to: start }),
      })
      await settle()

      expect(menu.changes).toEqual(['Language true'])
      expect(menu.toggleLog()).toEqual(['Language open'])
    },
  )
})

const pointAtY = ({ from, to, y }: { from: Point; to: Point; y: number }) => ({
  x: from.x + ((to.x - from.x) * (y - from.y)) / (to.y - from.y),
  y,
})

describe.each([
  { intervalMs: 16, name: 'slow', step: 1 },
  { intervalMs: 21, name: 'very slow', step: 1 },
  { intervalMs: 16, name: 'medium', step: 4 },
])('when the pointer changes its mind at $name speed', ({ intervalMs, step }) => {
  test(
    'should keep the submenu when the pointer heads back, then turns into it over a sibling',
    { timeout: 20_000 },
    async () => {
      const menu = await renderUserMenu()
      const start = await hoverSubmenu({ menu, name: 'Theme' })
      const submenuRect = menu.menuRectOf('Theme')
      const inside = { x: submenuRect.left + 24, y: menu.centerOf('Theme Three').y }
      const turn = pointAtY({
        from: inside,
        to: { x: menu.rectOf('Theme').left + 60, y: start.y },
        y: menu.centerOf('Language').y,
      })

      await movePointer({ points: pointsBetween({ from: start, step: 12, to: inside }) })
      await settle()
      await movePointer({
        intervalMs,
        points: [
          ...pointsBetween({ from: inside, step, to: turn }),
          ...pointsBetween({
            from: turn,
            step,
            to: { x: submenuRect.left + 24, y: menu.centerOf('Theme Three').y },
          }),
        ],
      })
      await settle()

      expect(isInRect({ point: turn, rect: menu.rectOf('Language') })).toBe(true)
      expect(menu.changes).toEqual(['Theme true'])
      expect(menu.toggleLog()).toEqual(['Theme open'])
    },
  )

  test(
    'should keep the submenu when the pointer heads in, then turns back to its trigger over a sibling',
    { timeout: 20_000 },
    async () => {
      const menu = await renderUserMenu()
      const start = await hoverSubmenu({ menu, name: 'Theme' })
      const inside = { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y }
      const turn = pointAtY({ from: start, to: inside, y: menu.centerOf('Language').y })

      await movePointer({
        intervalMs,
        points: [
          ...pointsBetween({ from: start, step, to: turn }),
          ...pointsBetween({
            from: turn,
            step,
            to: { x: menu.rectOf('Theme').left + 60, y: start.y },
          }),
        ],
      })
      await settle()

      expect(isInRect({ point: turn, rect: menu.rectOf('Language') })).toBe(true)
      expect(menu.changes).toEqual(['Theme true'])
      expect(menu.toggleLog()).toEqual(['Theme open'])
    },
  )
})

test('should hand over when the pointer turns away from both the trigger and the submenu', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const inside = { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y }
  const turn = pointAtY({ from: start, to: inside, y: menu.centerOf('Language').y })

  await movePointer({
    points: [
      ...pointsBetween({ from: start, step: 4, to: turn }),
      ...pointsBetween({
        from: turn,
        step: 2,
        to: { x: menu.rectOf('Settings').left + 20, y: menu.centerOf('Settings').y },
      }),
    ],
  })

  const firstSiblingOpen = menu
    .toggleLog()
    .findIndex((entry) => /^(Language|Settings) open$/.test(entry))

  expect(firstSiblingOpen).toBeGreaterThan(0)
  expect(menu.toggles[firstSiblingOpen].time).toBeLessThan(menu.moves.at(-1)!.time)
})

test('should hand over to the sibling under a pointer that stops dead', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const stop = { x: start.x + 60, y: menu.centerOf('Language').y }

  await movePointer({ points: pointsBetween({ from: start, step: 4, to: stop }) })
  await expect.poll(() => menu.changes).toEqual(['Theme true', 'Theme false', 'Language true'])

  expect(menu.toggleTime('Language open')).toBeGreaterThan(menu.moves.at(-1)!.time)
  expect(menu.toggleLog()).toEqual(['Theme open', 'Theme close', 'Language open'])
})

test('should arm from the point where the pointer turned towards the submenu', async () => {
  const menu = await renderUserMenu()

  await hoverSubmenu({ menu, name: 'Theme' })

  const themeRect = menu.rectOf('Theme')
  const turn = { x: themeRect.left + 60, y: themeRect.bottom - 2 }
  const target = { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y }

  await movePointer({
    points: [
      ...pointsBetween({ from: { x: themeRect.right - 30, y: turn.y }, step: 3, to: turn }),
      ...pointsBetween({ from: turn, step: 4, to: target }),
    ],
  })
  await settle()

  expect(menu.changes).toEqual(['Theme true'])
  expect(menu.toggleLog()).toEqual(['Theme open'])
})

test('should keep the submenu when the pointer rests near the trigger edge, then heads into it', async () => {
  const menu = await renderUserMenu()

  await hoverSubmenu({ menu, name: 'Theme' })

  const themeRect = menu.rectOf('Theme')
  const rest = { x: themeRect.right - 10, y: themeRect.bottom - 2 }
  const target = { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y }

  await movePointer({ points: [rest] })
  await settle()
  await settle()
  await movePointer({ points: pointsBetween({ from: rest, step: 4, to: target }) })
  await settle()

  expect(menu.changes).toEqual(['Theme true'])
  expect(menu.toggleLog()).toEqual(['Theme open'])
})

test('should hand over while the pointer turns back over a sibling', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const languageRect = menu.rectOf('Language')
  const forward = { x: start.x + 80, y: languageRect.top + 8 }
  const back = { x: languageRect.left + 8, y: languageRect.top + 16 }

  await movePointer({
    points: [
      ...pointsBetween({ from: start, step: 6, to: forward }),
      ...pointsBetween({ from: forward, step: 3, to: back }),
    ],
  })

  expect(menu.toggleTime('Language open')).toBeLessThan(menu.moves.at(-1)!.time)
})

test('should hand over when the approach slows to 20 px/s', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const target = { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y }
  const direction = { x: target.x - start.x, y: target.y - start.y }
  const length = Math.hypot(direction.x, direction.y)
  const alongPath = (distance: number) => ({
    x: start.x + (direction.x / length) * distance,
    y: start.y + (direction.y / length) * distance,
  })
  const slowFrom = alongPath(70)
  const slowTo = alongPath(78)

  await movePointer({
    intervalMs: 25,
    points: [
      ...pointsBetween({ from: start, step: 8, to: slowFrom }),
      ...pointsBetween({ from: slowFrom, step: 0.5, to: slowTo }),
      ...pointsBetween({ from: slowTo, step: 8, to: target }),
    ],
  })
  await settle()

  expect(isInRect({ point: slowFrom, rect: menu.rectOf('Language') })).toBe(true)
  expect(menu.toggleLog()).toContain('Language open')
})

test('should hand over when the movement is not aimed at the submenu', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const submenuRect = menu.menuRectOf('Theme')
  const settingsRect = menu.rectOf('Settings')
  const end = { x: submenuRect.left - 60, y: settingsRect.bottom - 2 }

  await movePointer({ points: pointsBetween({ from: start, step: 4, to: end }) })
  await settle()

  expect(menu.toggleLog()).toContain('Language open')
})

test("should hide covered rows' hover highlight while a submenu is open but keep it in the submenu", async () => {
  document.body.style.setProperty('--popup-item-bg-hover', 'rgb(1, 2, 3)')
  onTestFinished(() => document.body.style.removeProperty('--popup-item-bg-hover'))

  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const theme = menu.item('Theme').element()
  const language = menu.item('Language').element()
  const inside = { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y }
  const highlightWhileSubmenuOpen = ({ isTarget }: { isTarget: (element: Element) => boolean }) => {
    let highlight = ''

    return waitForPointer({
      isReady: () => {
        const last = menu.moves.at(-1)
        const hovered =
          last && document.elementFromPoint(last.x, last.y)?.closest('[role="menuitem"]')

        if (
          !hovered ||
          !isTarget(hovered) ||
          !hovered.matches(':hover') ||
          theme.getAttribute('aria-expanded') !== 'true'
        ) {
          return false
        }

        highlight = getComputedStyle(hovered).backgroundColor

        return true
      },
    }).then(() => highlight)
  }

  const movingIn = movePointer({ points: pointsBetween({ from: start, step: 1, to: inside }) })
  const coveredHighlight = await highlightWhileSubmenuOpen({
    isTarget: (element) => element === language,
  })

  await movingIn
  await settle()

  const movingBack = movePointer({ points: pointsBetween({ from: inside, step: 2, to: start }) })
  const submenuHighlight = await highlightWhileSubmenuOpen({
    isTarget: (element) => menu.menuOf('Theme').element().contains(element),
  })

  await movingBack

  expect(coveredHighlight).toBe('rgba(0, 0, 0, 0)')
  expect(submenuHighlight).toBe('rgb(1, 2, 3)')
})

test('should keep the covered row unhighlighted where it meets the trigger on the way back', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const language = menu.item('Language').element()
  const inside = { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y }
  const sharedEdge = { x: menu.rectOf('Theme').right - 20, y: menu.rectOf('Theme').bottom }
  const highlights: string[] = []
  const recordHighlight = () =>
    requestAnimationFrame(() => {
      if (language.matches(':hover')) {
        highlights.push(getComputedStyle(language).backgroundColor)
      }
    })

  await movePointer({ points: pointsBetween({ from: start, step: 12, to: inside }) })
  await settle()
  document.addEventListener('pointermove', recordHighlight, { capture: true })
  onTestFinished(() =>
    document.removeEventListener('pointermove', recordHighlight, { capture: true }),
  )
  await movePointer({
    points: [
      ...pointsBetween({ from: inside, step: 2, to: sharedEdge }),
      ...pointsBetween({ from: sharedEdge, step: 2, to: { x: sharedEdge.x - 8, y: start.y } }),
    ],
  })

  expect(new Set(highlights)).toEqual(new Set(['rgba(0, 0, 0, 0)']))
  expect(menu.changes).toEqual(['Theme true'])
})

test('should keep the submenu while an aimed movement leaves the menu on its way in', async () => {
  const menu = await renderUserMenu({ itemCounts: { Settings: 8 } })
  const start = await hoverSubmenu({ menu, name: 'Settings' })
  const target = { x: menu.menuRectOf('Settings').left + 24, y: menu.centerOf('Settings Eight').y }

  await movePointer({ points: pointsBetween({ from: start, step: 4, to: target }) })
  await settle()

  expect(menu.moves.some(({ y }) => y > menu.menuRectOf('Account').bottom + 8)).toBe(true)
  expect(menu.toggleLog()).toEqual(['Settings open'])
})

test('should close the submenu as soon as the pointer leaves the whole menu', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const outside = { x: menu.menuRectOf('Account').left - 20, y: start.y }

  await movePointer({ points: pointsBetween({ from: start, step: 4, to: outside }) })
  await settle()

  const firstMoveOutside = menu.moves.findIndex(({ x }) => x < menu.menuRectOf('Account').left)

  expect(menu.toggleLog()).toEqual(['Theme open', 'Theme close'])
  expect(menu.toggleTime('Theme close')).toBeGreaterThan(menu.moves[firstMoveOutside - 1].time)
  expect(menu.toggleTime('Theme close')).toBeLessThan(menu.moves[firstMoveOutside].time + 100)
  await expect.element(menu.item('Profile')).toBeVisible()
})

test('should keep the submenu while the pointer pauses in the gap beside it', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const submenuRect = menu.menuRectOf('Theme')
  const gapPoint = { x: submenuRect.left - 2, y: start.y }

  await movePointer({ points: pointsBetween({ from: start, step: 4, to: gapPoint }) })
  await settle()

  expect(menu.toggleLog()).toEqual(['Theme open'])
})

test.each([1, 4])(
  'should keep the submenu when the pointer slips %ipx out of its inner edge',
  async (distance) => {
    const menu = await renderUserMenu()
    const start = await hoverSubmenu({ menu, name: 'Theme' })
    const submenuRect = menu.menuRectOf('Theme')
    const inside = { x: submenuRect.left + 24, y: menu.centerOf('Theme Two').y }

    await movePointer({ points: pointsBetween({ from: start, step: 12, to: inside }) })
    await settle()
    await movePointer({
      points: pointsBetween({
        from: inside,
        step: 2,
        to: { x: submenuRect.left - distance, y: inside.y },
      }),
    })
    await settle()

    expect(menu.toggleLog()).toEqual(['Theme open'])
  },
)

describe.each([
  { isPlacedRight: true, name: 'placed right', paddingInlineStart: 100, side: 'right' as const },
  { isPlacedRight: true, name: 'flipped right', paddingInlineStart: 100, side: 'left' as const },
  { isPlacedRight: false, name: 'placed left', paddingInlineStart: 400, side: 'left' as const },
])('with the submenu $name', ({ isPlacedRight, paddingInlineStart, side }) => {
  test('should count the gap as part of the submenu along its full height', async () => {
    const menu = await renderUserMenu({ paddingInlineStart, side })

    await hoverSubmenu({ menu, name: 'Theme' })

    const menuRect = menu.menuRectOf('Account')
    const submenuRect = menu.menuRectOf('Theme')
    const gapX = isPlacedRight ? submenuRect.left - 2 : submenuRect.right + 2
    const hitsAlongGap = () =>
      [submenuRect.top + 1, submenuRect.top + submenuRect.height / 2, submenuRect.bottom - 1].map(
        (y) => document.elementFromPoint(gapX, y),
      )

    expect(
      isPlacedRight ? submenuRect.left > menuRect.right : submenuRect.right < menuRect.left,
    ).toBe(true)
    await expect.poll(hitsAlongGap).toEqual([0, 1, 2].map(() => menu.menuOf('Theme').element()))
  })
})

test('should close the submenu when the pointer stops dead outside the menu', async () => {
  const menu = await renderUserMenu({ itemCounts: { Settings: 8 } })
  const start = await hoverSubmenu({ menu, name: 'Settings' })
  const target = { x: menu.menuRectOf('Settings').left + 24, y: menu.centerOf('Settings Eight').y }
  const outsideY = menu.menuRectOf('Account').bottom + 16
  const stop = {
    x: start.x + ((target.x - start.x) * (outsideY - start.y)) / (target.y - start.y),
    y: outsideY,
  }

  await movePointer({ points: pointsBetween({ from: start, step: 4, to: stop }) })
  await settle()

  expect(stop.x).toBeLessThan(menu.menuRectOf('Account').right)
  expect(menu.toggleLog()).toEqual(['Settings open', 'Settings close'])
  await expect.element(menu.item('Profile')).toBeVisible()
})

test('should close a hovered submenu when its trigger is clicked and keep it closed', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })

  await movePointer({
    points: pointsBetween({ from: start, step: 4, to: { x: start.x + 40, y: start.y } }),
    shouldClickAtEnd: true,
  })
  await settle()

  expect(menu.toggleLog()).toEqual(['Theme open', 'Theme close'])
  await expect.element(menu.item('Theme')).toHaveAttribute('aria-expanded', 'false')
})

const openThemeWithKeyboard = async ({
  menu,
}: {
  menu: Awaited<ReturnType<typeof renderUserMenu>>
}) => {
  await movePointer({ points: [menu.centerOf('Log out')] })
  menu.item('Profile').element().focus()
  await userEvent.keyboard('{ArrowDown}')
  await expect.element(menu.item('Theme')).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  await expect.element(menu.item('Theme One')).toHaveFocus()
}

test('should keep a keyboard-opened submenu and its keys working when the mouse nudges', async () => {
  const menu = await renderUserMenu()

  await openThemeWithKeyboard({ menu })

  const logOut = menu.centerOf('Log out')

  await movePointer({
    points: pointsBetween({ from: logOut, step: 1, to: { x: logOut.x + 4, y: logOut.y - 1 } }),
  })
  await settle()
  await userEvent.keyboard('{ArrowDown}')

  await expect.element(menu.item('Theme Two')).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await expect.element(menu.item('Theme')).toHaveFocus()
  expect(menu.toggleLog()).toEqual(['Theme open', 'Theme close'])
})

test('should keep a keyboard-opened submenu when the mouse leaves the menu', async () => {
  const menu = await renderUserMenu()

  await openThemeWithKeyboard({ menu })

  const logOut = menu.centerOf('Log out')

  await movePointer({
    points: pointsBetween({
      from: logOut,
      step: 4,
      to: { x: logOut.x, y: menu.menuRectOf('Account').bottom + 40 },
    }),
  })
  await settle()

  await expect.element(menu.item('Theme One')).toHaveFocus()
  expect(menu.toggleLog()).toEqual(['Theme open'])
})

test('should move focus into the root menu when the mouse takes over a focused submenu', async () => {
  const menu = await renderUserMenu()

  await openThemeWithKeyboard({ menu })
  await movePointer({
    points: pointsBetween({
      from: menu.centerOf('Log out'),
      step: 4,
      to: menu.centerOf('Settings'),
    }),
  })
  await expect.element(menu.menuOf('Settings')).toBeVisible()

  expect(menu.toggleLog()).toEqual(['Theme open', 'Theme close', 'Settings open'])
  expect(menu.menuOf('Account').element().contains(document.activeElement)).toBe(true)
  expect(menu.menuOf('Theme').query()).toBeNull()
})

test('should open a submenu on pen hover and keep it while the pen heads into it', async () => {
  const menu = await renderUserMenu()
  const themeRect = menu.rectOf('Theme')
  const start = { x: themeRect.left + 30, y: menu.centerOf('Theme').y }

  await movePointer({ pointerType: 'pen', points: [start] })
  await expect.element(menu.menuOf('Theme')).toBeVisible()
  await movePointer({
    pointerType: 'pen',
    points: pointsBetween({
      from: start,
      step: 4,
      to: { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y },
    }),
  })
  await settle()

  expect(menu.toggleLog()).toEqual(['Theme open'])
})

test('should ignore touch hover and keep click-to-toggle for touch', async () => {
  const menu = await renderUserMenu()
  const theme = menu.item('Theme').element()

  theme.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'touch' }))
  await settle()

  expect(menu.toggleLog()).toEqual([])
  await menu.item('Theme').click()
  await expect.element(menu.menuOf('Theme')).toBeVisible()
})

test('should open a custom non-button trigger on hover and keep it on the way in', async () => {
  const menu = await renderUserMenu({ customTriggers: ['Theme'] })
  const start = await hoverSubmenu({ menu, name: 'Theme' })

  await movePointer({
    points: pointsBetween({
      from: start,
      step: 4,
      to: { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y },
    }),
  })
  await settle()

  expect(menu.item('Theme').element().tagName).toBe('DIV')
  expect(menu.toggleLog()).toEqual(['Theme open'])
})

test('should keep tracking the open submenu when the menus re-render', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const inside = { x: menu.menuRectOf('Theme').left + 24, y: menu.centerOf('Theme Three').y }

  await movePointer({ points: pointsBetween({ from: start, step: 12, to: inside }) })
  await menu.rerender()
  await movePointer({
    points: pointsBetween({
      from: inside,
      step: 4,
      to: { x: menu.rectOf('Theme').right - 20, y: start.y },
    }),
  })
  await settle()

  expect(menu.toggleLog()).toEqual(['Theme open'])
})

const stopDelayTimers = () => {
  const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
  const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')

  onTestFinished(() => {
    setTimeoutSpy.mockRestore()
    clearTimeoutSpy.mockRestore()
  })

  return {
    lastPendingId: () =>
      setTimeoutSpy.mock.results
        .filter((_, index) => {
          const delay = setTimeoutSpy.mock.calls[index][1] ?? 0

          return delay >= 15 && delay <= 60
        })
        .at(-1)?.value,
    wasCleared: (id: unknown) => clearTimeoutSpy.mock.calls.some(([clearedId]) => clearedId === id),
  }
}

test('should leave no timer or listener behind when an open submenu unmounts', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const timers = stopDelayTimers()
  const removeListenerSpy = vi.spyOn(document, 'removeEventListener')

  onTestFinished(() => removeListenerSpy.mockRestore())

  await movePointer({
    points: pointsBetween({ from: start, step: 4, to: { x: start.x + 40, y: start.y + 10 } }),
  })

  const pendingStopTimer = timers.lastPendingId()

  await menu.rerender({ submenus: ['Language', 'Settings'] })

  expect(pendingStopTimer).toBeDefined()
  expect(timers.wasCleared(pendingStopTimer)).toBe(true)
  expect(removeListenerSpy.mock.calls.some(([type]) => type === 'pointermove')).toBe(true)
})

test('should stop tracking when the whole menu unmounts', async () => {
  const menu = await renderUserMenu()
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const timers = stopDelayTimers()

  await movePointer({
    points: pointsBetween({ from: start, step: 4, to: { x: start.x + 40, y: start.y + 10 } }),
  })

  const pendingStopTimer = timers.lastPendingId()

  await menu.unmount()

  expect(pendingStopTimer).toBeDefined()
  expect(timers.wasCleared(pendingStopTimer)).toBe(true)
})

test('should hide sibling hover highlights while a click-opened submenu is open', async () => {
  document.body.style.setProperty('--popup-item-bg-hover', 'rgb(1, 2, 3)')
  onTestFinished(() => document.body.style.removeProperty('--popup-item-bg-hover'))

  const menu = await renderUserMenu({ clickOnly: ['Theme'] })
  const logOut = menu.item('Log out').element()

  await movePointer({ points: [menu.centerOf('Log out')] })
  await expect.poll(() => getComputedStyle(logOut).backgroundColor).toBe('rgb(1, 2, 3)')

  menu.item('Theme').element().click()
  await expect.element(menu.menuOf('Theme')).toBeVisible()
  await movePointer({ points: [menu.centerOf('Profile'), menu.centerOf('Log out')] })

  expect(logOut.matches(':hover')).toBe(true)
  expect(getComputedStyle(logOut).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  expect(menu.toggleLog()).toEqual(['Theme open'])
})

test('should treat a pointer deep in a nested submenu as inside the open submenu', async () => {
  const menu = await renderUserMenu({ nestedSubmenu: { label: 'Color', parent: 'Theme' } })
  const start = await hoverSubmenu({ menu, name: 'Theme' })
  const color = { x: menu.rectOf('Color').left + 30, y: menu.centerOf('Color').y }

  await movePointer({ points: pointsBetween({ from: start, step: 6, to: color }) })
  await expect.element(menu.menuOf('Color')).toBeVisible()

  const deep = { x: menu.menuRectOf('Color').left + 40, y: menu.centerOf('Color Three').y }
  const back = { x: menu.menuRectOf('Color').left + 8, y: menu.centerOf('Color One').y }

  await movePointer({ points: pointsBetween({ from: color, step: 4, to: deep }) })
  await settle()
  await movePointer({ points: pointsBetween({ from: deep, step: 2, to: back }) })
  await settle()

  expect(menu.changes).toEqual(['Theme true', 'Color true'])
  expect(menu.toggleLog()).toEqual(['Theme open', 'Color open'])
})
