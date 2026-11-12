export function createKeyInteraction({ page, pauseScale }) {
  return async ({ key, settleMs = 800 }) => {
    await page.keyboard.press(key, { delay: 80 * pauseScale })
    await page.waitForTimeout(settleMs * pauseScale)
  }
}
