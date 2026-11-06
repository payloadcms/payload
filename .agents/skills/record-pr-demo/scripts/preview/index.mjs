import { mountDemoChrome } from '../WindowChrome/index.mjs'
import { observeAccessibility } from '../accessibility-demo.mjs'

const isAccessibility = new URLSearchParams(location.search).has('accessibility')

const root = document.querySelector('#chrome')
const chrome = mountDemoChrome({
  root,
  accessibility: isAccessibility,
  showAnnouncements: new URLSearchParams(location.search).has('announcements'),
  theme: new URLSearchParams(location.search).get('theme') === 'dark' ? 'dark' : 'light',
  change: {
    kind: new URLSearchParams(location.search).get('kind') === 'fix' ? 'Fix' : 'Feature',
    title: isAccessibility ? 'Make keyboard interactions visible' : 'Responsive collection lists',
    description: isAccessibility
      ? 'Follow keyboard input and movement announcements.'
      : 'Browse and manage content on desktop, tablet, and mobile.',
  },
})
const application = document.createElement('iframe')
application.slot = 'content'
application.title = 'Responsive sample application'
application.src = isAccessibility
  ? '/preview/accessibility-application.html'
  : '/preview/application.html'
let stopAccessibility
if (isAccessibility)
  application.addEventListener('load', () => {
    stopAccessibility?.()
    stopAccessibility = observeAccessibility({
      window: application.contentWindow,
      report: (state) => chrome.setAccessibilityState(state),
    })
  })
root.append(application)
const timeline = document.querySelector('#timeline')
const play = document.querySelector('#play')
const timelineDuration = 5200
const tabletArrival = 1600
const tabletDeparture = 2800
const mobileArrival = 4000
let time = 0
let animation
let width = 1280

function renderAt({ milliseconds }) {
  time = Math.max(0, Math.min(timelineDuration, milliseconds))
  const isFirstResize = time <= tabletArrival
  const progress = Math.max(0, Math.min(1, (time - (isFirstResize ? 400 : tabletDeparture)) / 1200))
  const eased = progress * progress * (3 - 2 * progress)
  width = Math.round(isFirstResize ? 1280 - 512 * eased : 768 - 378 * eased)
  chrome.setViewport({ width, height: 720 })
  const step =
    time < tabletArrival
      ? {
          index: 1,
          title: 'See the full picture',
          body: 'View post titles, publishing status, and update dates together.',
        }
      : time < mobileArrival
        ? {
            index: 2,
            title: 'Keep essential details visible',
            body: 'Update dates hide as space narrows; titles and status remain.',
          }
        : {
            index: 3,
            title: 'Make room for content',
            body: 'The sidebar collapses so the post list can use the full width.',
          }
  chrome.setAnnotation(
    document.querySelector('#annotation').checked
      ? isAccessibility
        ? {
            index: 1,
            total: 1,
            title: 'Try it with the keyboard',
            body: 'Click a Move down button, then use Tab and Enter. Commands and announcements appear below this step.',
          }
        : { ...step, total: 3 }
      : null,
  )
  chrome.setSizeVisible({ isVisible: document.querySelector('#dimensions').checked })
  timeline.value = String(time)
  document.querySelector('#time').textContent =
    `${(time / 1000).toFixed(2)} / ${(timelineDuration / 1000).toFixed(2)} s`
  document.querySelectorAll('[data-width]').forEach((button) => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.width) === width))
  })
}
function stop() {
  cancelAnimationFrame(animation)
  animation = undefined
  play.textContent = 'Play resize'
  document.querySelector('#status').textContent = `Window: ${width} × 720. Canvas: 1600 × 1000.`
}
document.querySelectorAll('[data-width]').forEach((button) =>
  button.addEventListener('click', () => {
    const target = Number(button.dataset.width)
    renderAt({
      milliseconds: target === 1280 ? 0 : target === 768 ? tabletArrival : timelineDuration,
    })
    stop()
  }),
)
timeline.addEventListener('input', () => {
  renderAt({ milliseconds: Number(timeline.value) })
  stop()
})
for (const id of ['dimensions', 'annotation'])
  document
    .querySelector(`#${id}`)
    .addEventListener('change', () => renderAt({ milliseconds: time }))
play.addEventListener('click', () => {
  if (animation !== undefined) {
    stop()
    return
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    renderAt({ milliseconds: timelineDuration })
    stop()
    return
  }
  const start = performance.now()
  const offset = time >= timelineDuration ? 0 : time
  play.textContent = 'Pause'
  const tick = (now) => {
    renderAt({ milliseconds: offset + now - start })
    if (time < timelineDuration) animation = requestAnimationFrame(tick)
    else stop()
  }
  animation = requestAnimationFrame(tick)
})
renderAt({ milliseconds: 0 })

const refresh = document.querySelector('#refresh')
refresh.addEventListener('click', async () => {
  if (refresh.getAttribute('aria-disabled') === 'true') return
  refresh.setAttribute('aria-disabled', 'true')
  chrome.setRefreshState({ state: 'refreshing' })
  const started = performance.now()
  const loaded = new Promise((resolve) =>
    application.addEventListener('load', resolve, { once: true }),
  )
  application.contentWindow.location.reload()
  await loaded
  await new Promise((resolve) =>
    setTimeout(resolve, Math.max(0, 300 - (performance.now() - started))),
  )
  chrome.setRefreshState({ state: 'refreshed' })
  refresh.setAttribute('aria-disabled', 'false')
})
