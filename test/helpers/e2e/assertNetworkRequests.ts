import type { Page, Request } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Counts the number of network requests every `interval` milliseconds until `timeout` is reached.
 * Useful to ensure unexpected network requests are not triggered by an action.
 * For example, an effect within a component might fetch data multiple times unnecessarily.
 * @param page The Playwright page
 * @param url The URL to match in the network requests
 * @param action The action to perform
 * @param options Options
 * @param options.allowedNumberOfRequests The number of requests that are allowed to be made, defaults to 1
 * @param options.beforePoll A function to run before polling the network requests
 * @param options.interval The interval in milliseconds to poll the network requests, defaults to 1000
 * @param options.timeout The timeout in milliseconds to poll the network requests, defaults to 5000
 * @returns The matched network requests
 */
export const assertNetworkRequests = async (
  page: Page,
  url: string,
  action: () => Promise<any>,
  {
    beforePoll,
    allowedNumberOfRequests = 1,
    timeout = 5000,
    interval = 1000,
  }: {
    allowedNumberOfRequests?: number
    beforePoll?: () => Promise<any> | void
    interval?: number
    timeout?: number
  } = {},
): Promise<Array<Request>> => {
  const matchedRequests: Request[] = []

  // begin tracking network requests
  page.on('request', (request) => {
    if (request.url().includes(url)) {
      matchedRequests.push(request)
    }
  })

  await action()

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
