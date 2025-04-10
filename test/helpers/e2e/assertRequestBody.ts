import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * A helper function to assert the body of a network request.
 * This is useful for reading the body of a request and testing whether it is correct.
 * For example, if you have a form that submits data to an API, you can use this function to
 * assert that the data being sent is correct.
 * @param page The Playwright page
 * @param options Options
 * @param options.action The action to perform that will trigger the request
 * @param options.expect A function to run after the request is made to assert the request body
 * @returns The request body
 * @example
 * const requestBody = await assertRequestBody(page, {
 *   action: page.click('button'),
 *   expect: (requestBody) => expect(requestBody.foo).toBe('bar')
 * })
 */
export const assertRequestBody = async <T>(
  page: Page,
  options: {
    action: () => Promise<void> | void
    expect?: (requestBody: T) => boolean | Promise<boolean>
    requestMethod?: string
    url: string
  },
): Promise<T | undefined> => {
  const [request] = await Promise.all([
    page.waitForRequest((request) =>
      Boolean(
        request.url().startsWith(options.url) &&
          (request.method() === options.requestMethod || 'POST'),
      ),
    ),
    await options.action(),
  ])

  const requestBody = request.postData()

  if (typeof requestBody === 'string') {
    const parsedBody = JSON.parse(requestBody) as T

    if (typeof options.expect === 'function') {
      expect(await options.expect(parsedBody)).toBeTruthy()
    }

    return parsedBody
  }
}
