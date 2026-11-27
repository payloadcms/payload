import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Limits the browser's upload bandwidth so upload progress takes long enough to observe.
 * Downloads are not limited. Uses the Chrome DevTools Protocol, so it only works in Chromium.
 *
 * @returns A function that removes the limit.
 */
export async function throttleUploads({
  bytesPerSecond,
  page,
}: {
  bytesPerSecond: number
  page: Page
}): Promise<() => Promise<void>> {
  const session = await page.context().newCDPSession(page)

  await session.send('Network.enable')
  await session.send('Network.emulateNetworkConditions', {
    downloadThroughput: -1,
    latency: 0,
    offline: false,
    uploadThroughput: bytesPerSecond,
  })

  return async () => {
    await session.send('Network.emulateNetworkConditions', {
      downloadThroughput: -1,
      latency: 0,
      offline: false,
      uploadThroughput: -1,
    })
    await session.detach()
  }
}

/**
 * Records every distinct toast text the page shows from now on, in order. Checking the history
 * after an upload finishes avoids racing short-lived states like a single percentage.
 *
 * @returns A function that reads the recorded texts.
 */
export async function recordToastHistory({
  page,
}: {
  page: Page
}): Promise<() => Promise<string[]>> {
  await page.evaluate(() => {
    const history: string[] = []
    const record = () => {
      for (const toast of document.querySelectorAll<HTMLElement>('[data-sonner-toast]')) {
        const text = toast.innerText.replace(/\s+/g, ' ').trim()

        if (text && !history.includes(text)) {
          history.push(text)
        }
      }
    }

    ;(window as { __payloadToastHistory?: string[] } & Window).__payloadToastHistory = history
    record()
    new MutationObserver(record).observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    })
  })

  return () =>
    page.evaluate(
      () => (window as { __payloadToastHistory?: string[] } & Window).__payloadToastHistory ?? [],
    )
}

/**
 * The percentages in recorded toast texts that match `pattern`, whose first capture group is the
 * percentage, in the order they were shown.
 */
export function getUploadPercents({
  history,
  pattern,
}: {
  history: string[]
  pattern: RegExp
}): number[] {
  return history.flatMap((text) => {
    const percent = pattern.exec(text)?.[1]

    return percent === undefined ? [] : [Number(percent)]
  })
}

/**
 * Checks that the recorded toasts showed the upload of `fileName` with at least
 * `minimumPercentCount` percentages, never going backwards, followed by "Processing and saving"
 * unless `isProcessingRequired` is false (a fast upload can skip it between renders). `prefix`
 * matches text before the file message, such as a bulk upload position.
 */
export function expectUploadProgressSequence({
  fileName,
  history,
  isProcessingRequired = true,
  minimumPercentCount = 2,
  prefix = '',
}: {
  fileName: string
  history: string[]
  isProcessingRequired?: boolean
  minimumPercentCount?: number
  prefix?: string
}): void {
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const progressPattern = new RegExp(`${escape(prefix)}Uploading ${escape(fileName)}: (\\d+)%`)
  const percents = getUploadPercents({ history, pattern: progressPattern })
  const lastProgressIndex = history.reduce(
    (last, text, index) => (progressPattern.test(text) ? index : last),
    -1,
  )
  const processingIndex = history.findIndex((text) =>
    text.includes(`${prefix}Processing and saving ${fileName}`),
  )

  expect(percents.length, `Upload progress toasts: ${history.join(' | ')}`).toBeGreaterThanOrEqual(
    minimumPercentCount,
  )
  expect(percents).toEqual([...percents].sort((a, b) => a - b))
  if (isProcessingRequired) {
    expect(processingIndex, `Toasts: ${history.join(' | ')}`).toBeGreaterThan(lastProgressIndex)
  }
}
