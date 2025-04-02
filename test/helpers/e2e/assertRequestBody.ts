import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

export const assertRequestBody = async <T>(
  page: Page,
  options: {
    action: Promise<void> | void
    expect?: (requestBody: T) => boolean | Promise<boolean>
  },
): Promise<T | undefined> => {
  const [request] = await Promise.all([
    page.waitForRequest((request) => request.method() === 'POST'), // Adjust condition as needed
    await options.action,
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
