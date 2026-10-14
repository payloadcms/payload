const STORAGE_KEY = 'payload-pr-demo-timer'

const TIMER_STYLES = `
  [data-pr-demo-annotation="banner"] .pr-demo-annotation-timer {
    flex: 0 0 auto;
    margin-inline-start: auto;
  }
  [data-pr-demo-annotation="banner"] .pr-demo-annotation-timer-value {
    display: flex;
    align-items: center;
    gap: var(--spacer-1-5);
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    font-variant-numeric: tabular-nums;
  }
  [data-pr-demo-annotation="banner"] .pr-demo-annotation-timer-icon {
    display: block;
    width: 12px;
    height: 12px;
    flex: 0 0 12px;
  }
`

// Match Payload's ClockIcon in packages/ui/src/icons/Clock/index.tsx.
const CLOCK_PATH =
  'M7 0C10.866 0 14 3.13401 14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0ZM7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1ZM7 3C7.27614 3 7.5 3.22386 7.5 3.5V6.79297L9.35352 8.64648C9.54878 8.84175 9.54878 9.15825 9.35352 9.35352C9.15825 9.54878 8.84175 9.54878 8.64648 9.35352L6.64648 7.35352C6.55272 7.25975 6.5 7.13261 6.5 7V3.5C6.5 3.22386 6.72386 3 7 3Z'

export function createTimerInteraction({ page }) {
  return {
    hideTimer: async () => {
      await page.evaluate(
        ({ storageKey }) => {
          document.querySelector('.pr-demo-annotation-timer')?.remove()
          sessionStorage.removeItem(storageKey)
        },
        { storageKey: STORAGE_KEY },
      )
    },
    startTimer: async ({ label }) => {
      if (typeof label !== 'string' || !label.trim()) {
        throw new Error('Timer label must be non-empty text')
      }

      await page.evaluate(
        ({ label, storageKey }) => {
          if (!document.querySelector('[data-pr-demo-annotation="banner"]')) {
            throw new Error('Show a banner annotation before starting its timer')
          }
          sessionStorage.setItem(
            storageKey,
            JSON.stringify({
              label: label.trim(),
              startedAt: performance.timeOrigin + performance.now(),
              status: 'running',
            }),
          )
        },
        { label, storageKey: STORAGE_KEY },
      )
      await page.evaluate(renderTimer, {
        clockPath: CLOCK_PATH,
        storageKey: STORAGE_KEY,
        styles: TIMER_STYLES,
      })
    },
    stopTimer: async () => {
      const elapsedMilliseconds = await page.evaluate(
        ({ storageKey }) => {
          const state = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
          if (!state || state.status !== 'running') {
            throw new Error('Timer must be running before stopTimer()')
          }

          state.elapsedMilliseconds = Math.max(
            0,
            performance.timeOrigin + performance.now() - state.startedAt,
          )
          state.status = 'stopped'
          sessionStorage.setItem(storageKey, JSON.stringify(state))
          return state.elapsedMilliseconds
        },
        { storageKey: STORAGE_KEY },
      )
      await page.evaluate(renderTimer, {
        clockPath: CLOCK_PATH,
        storageKey: STORAGE_KEY,
        styles: TIMER_STYLES,
      })
      return elapsedMilliseconds
    },
  }
}

function renderTimer({ clockPath, storageKey, styles }) {
  const banner = document.querySelector('[data-pr-demo-annotation="banner"]')
  if (!banner) {
    throw new Error('Show a banner annotation before displaying its timer')
  }

  const state = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
  if (!state) return

  document.querySelector('.pr-demo-annotation-timer')?.remove()
  if (!document.querySelector('[data-pr-demo-timer-styles]')) {
    const style = document.createElement('style')
    style.setAttribute('data-pr-demo-timer-styles', '')
    style.textContent = styles
    document.head.append(style)
  }

  const section = document.createElement('div')
  section.className = 'pr-demo-annotation-section pr-demo-annotation-timer'
  const title = document.createElement('div')
  title.className = 'pr-demo-annotation-title'
  title.textContent = state.label

  const value = document.createElement('div')
  value.className = 'pr-demo-annotation-timer-value'
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  icon.setAttribute('aria-hidden', 'true')
  icon.setAttribute('class', 'pr-demo-annotation-timer-icon')
  icon.setAttribute('fill', 'none')
  icon.setAttribute('viewBox', '0 0 14 14')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', clockPath)
  path.setAttribute('fill', 'currentColor')
  icon.append(path)
  const time = document.createElement('span')
  value.append(icon, time)
  section.append(title, value)
  banner.append(section)

  const update = () => {
    if (!section.isConnected) return
    const elapsedMilliseconds =
      state.status === 'stopped'
        ? state.elapsedMilliseconds
        : Math.max(0, performance.timeOrigin + performance.now() - state.startedAt)
    time.textContent = `${(elapsedMilliseconds / 1000).toFixed(2)} s`
    if (state.status === 'running') requestAnimationFrame(update)
  }
  update()
}
