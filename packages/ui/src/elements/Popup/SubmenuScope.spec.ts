import { afterEach, expect, test, vi } from 'vitest'

import { createSubmenuScope } from './SubmenuScope.js'

afterEach(() => {
  vi.useRealTimers()
})

test('should close the active sibling branch when another child opens', () => {
  const scope = createSubmenuScope()
  const closed: string[] = []
  const first = { id: 'first', closeBranch: () => closed.push('first'), open: () => {} }
  const second = { id: 'second', closeBranch: () => closed.push('second'), open: () => {} }

  scope.register(first)
  scope.register(second)
  scope.requestOpen({ delay: false, id: 'first' })
  scope.requestOpen({ delay: false, id: 'second' })

  expect(closed).toEqual(['first'])
})

test('should cancel a pending sibling activation', () => {
  const scope = createSubmenuScope()
  const opened: string[] = []
  scope.register({ id: 'first', closeBranch: () => {}, open: () => opened.push('first') })

  scope.requestOpen({ delay: true, id: 'first' })
  scope.cancelPending('first')

  expect(opened).toEqual([])
})

test('should reopen a child after its branch releases the active slot', () => {
  const scope = createSubmenuScope()
  let openCount = 0
  scope.register({ id: 'first', closeBranch: () => {}, open: () => openCount++ })

  scope.requestOpen({ delay: false, id: 'first' })
  scope.release('first')
  scope.requestOpen({ delay: false, id: 'first' })

  expect(openCount).toBe(2)
})

test('should use a custom hover delay when opening a child', () => {
  vi.useFakeTimers()
  const scope = createSubmenuScope({ hoverDelay: 300 })
  let openCount = 0

  scope.register({ id: 'first', closeBranch: () => {}, open: () => openCount++ })
  scope.requestOpen({ delay: true, id: 'first' })

  vi.advanceTimersByTime(299)
  expect(openCount).toBe(0)

  vi.advanceTimersByTime(1)
  expect(openCount).toBe(1)
})
