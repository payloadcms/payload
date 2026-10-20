import { expect, test, vi } from 'vitest'

import { createSubmenuScope } from './SubmenuScope.js'

test('should open a pending sibling without restarting its delay on pointer movement', () => {
  vi.useFakeTimers()
  const scope = createSubmenuScope()

  try {
    for (const id of ['theme', 'language']) {
      scope.register({ id, closeBranch: () => {}, open: () => {} })
    }

    scope.requestOpen({ id: 'theme', delay: false })
    scope.requestOpen({ id: 'language', delay: true })
    vi.advanceTimersByTime(50)
    scope.requestOpen({ id: 'language', delay: true })
    vi.advanceTimersByTime(50)
    scope.requestOpen({ id: 'language', delay: true })
    vi.advanceTimersByTime(50)

    expect(scope.activeChildId).toBe('language')
  } finally {
    scope.closeActiveBranch()
    vi.useRealTimers()
  }
})
