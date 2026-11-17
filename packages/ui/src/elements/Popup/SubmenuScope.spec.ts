import { expect, test } from 'vitest'

import { createSubmenuScope } from './SubmenuScope.js'

test('should protect pointer handoff while allowing an explicit selection', () => {
  const scope = createSubmenuScope()

  scope.register({
    id: 'theme',
    closeBranch: () => {},
    isPointerProtected: () => true,
    open: () => {},
  })
  scope.register({ id: 'language', closeBranch: () => {}, open: () => {} })
  scope.requestOpen({ id: 'theme' })
  scope.requestOpen({ id: 'language', viaPointer: true })
  expect(scope.activeChildId).toBe('theme')

  scope.requestOpen({ id: 'language' })
  expect(scope.activeChildId).toBe('language')
})
