import { describe, expect, it } from 'vitest'

import { AccountView } from './Account/index.js'
import { DocumentView } from './Document/index.js'
import { getViewByType } from './getViewByType.js'
import { ListView } from './List/index.js'

describe('getViewByType', () => {
  it('should return the correct TanStack view component for each view type', () => {
    expect(getViewByType('account')).toBe(AccountView)
    expect(getViewByType('document')).toBe(DocumentView)
    expect(getViewByType('list')).toBe(ListView)
    expect(getViewByType('trash')).toBe(ListView)
  })

  it('should return undefined for view types handled by other dispatchers', () => {
    expect(getViewByType('dashboard')).toBeUndefined()
    expect(getViewByType('login')).toBeUndefined()
    expect(getViewByType('logout')).toBeUndefined()
    expect(getViewByType(undefined)).toBeUndefined()
  })
})
