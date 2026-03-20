import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

function parseRSC(rscText: string) {
  // Next.js streams use special delimiters like "\n"
  const chunks = rscText.split('\n').filter((line) => line.trim() !== '')

  // find the chunk starting with '1:', remove the '1:' prefix and parse the rest
  const match = chunks.find((chunk) => chunk.startsWith('1:'))

  if (match) {
    const jsonString = match.slice(2).trim()
    if (jsonString) {
      try {
        return JSON.parse(jsonString)
      } catch (err) {
        console.error('Failed to parse JSON:', err)
      }
    }
  }

  return null
}

/**
 * A helper function to assert the response of a network request.
 * This is useful for reading the response of a request and testing whether it is correct.
 * For example, if you have a form that submits data to an API, you can use this function to
 * assert that the data sent back is correct.
 * @param page The Playwright page
 * @param options Options
 * @param options.action The action to perform that will trigger the request
 * @param options.expect A function to run after the request is made to assert the response body
 * @param options.url The URL to match in the network requests
 * @returns The request body
 * @example
 * const responseBody = await assertResponseBody(page, {
 *   action: page.click('button'),
 *   expect: (responseBody) => expect(responseBody.foo).toBe('bar')
 * })
 */
export const assertResponseBody = async <T>(
  page: Page,
  options: {
    action: Promise<void> | void
    expect?: (requestBody: T) => boolean | Promise<boolean>
    requestMethod?: string
    responseContentType?: string
    url?: string
  },
): Promise<T | undefined> => {
  const [response] = await Promise.all([
    page.waitForResponse((response) =>
      Boolean(
        response.url().includes(options.url || '') &&
          response.status() === 200 &&
          response
            .headers()
            ['content-type']?.includes(options.responseContentType || 'application/json'),
      ),
    ),
    await options.action,
  ])

  if (!response) {
    throw new Error('No response received')
  }

  const responseBody = await response.text()
  const responseType = response.headers()['content-type']?.split(';')[0]

  let parsedBody: T = undefined as T

  if (responseType === 'text/x-component') {
    parsedBody = parseRSC(responseBody)
  } else if (typeof responseBody === 'string') {
    parsedBody = JSON.parse(responseBody) as T
  }

  if (typeof options.expect === 'function') {
    expect(await options.expect(parsedBody)).toBeTruthy()
  }

  return parsedBody
}
