import type { Page, Request } from '@playwright/test'

import { expect } from '@playwright/test'

// Allows you to test the number of network requests triggered by an action
// This can be used to ensure various actions do not trigger unnecessary requests
// For example, an effect within a component might fetch data multiple times unnecessarily
export const trackNetworkRequests = async (
  page: Page,
  url: string,
  options?: {
    allowedNumberOfRequests?: number
    beforePoll?: () => Promise<any> | void
    interval?: number
    timeout?: number
  },
): Promise<Array<Request>> => {
  const { beforePoll, allowedNumberOfRequests = 1, timeout = 5000, interval = 1000 } = options || {}

  const matchedRequests = []

  // begin tracking network requests
  page.on('request', (request) => {
    if (request.url().includes(url)) {
      matchedRequests.push(request)
    }
  })

  if (typeof beforePoll === 'function') {
    await beforePoll()
  }

  const startTime = Date.now()

  // continuously poll even after a request has been matched
  // this will ensure no subsequent requests are made
  // such as a result of a `useEffect` within a component
  while (Date.now() - startTime < timeout) {
    if (matchedRequests.length > 0) {
      expect(matchedRequests.length).toBeLessThanOrEqual(allowedNumberOfRequests)
    }

    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  expect(matchedRequests.length).toBe(allowedNumberOfRequests)

  return matchedRequests
}
