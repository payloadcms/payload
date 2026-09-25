import { describe, expect, it } from 'vitest'

import { getViewportMeta, isIPhoneUserAgent } from './viewport.js'

describe('RootLayout', () => {
  it('should apply the focus zoom viewport workaround to iPhone user agents only', () => {
    const iPhoneUserAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    const androidUserAgent =
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

    expect(isIPhoneUserAgent(iPhoneUserAgent)).toBe(true)
    expect(isIPhoneUserAgent(androidUserAgent)).toBe(false)
    expect(isIPhoneUserAgent(undefined)).toBe(false)
    expect(getViewportMeta(iPhoneUserAgent).props).toEqual({
      content: 'width=device-width, initial-scale=1, maximum-scale=1',
      name: 'viewport',
    })
    expect(getViewportMeta(androidUserAgent).props).toEqual({
      content: 'width=device-width, initial-scale=1',
      name: 'viewport',
    })
  })
})
