import { bindDemoHistory, mountDemoChrome } from '../WindowChrome/index.mjs'
import { mountAnnotationSidebar } from '../WindowChrome/sidebar.mjs'
import { observeAccessibility } from '../accessibility-demo.mjs'

const isAccessibility = new URLSearchParams(location.search).has('accessibility')

let theme = new URLSearchParams(location.search).get('theme') === 'dark' ? 'dark' : 'light'

const root = document.querySelector('#chrome')
const application = document.createElement('iframe')
const chrome = mountDemoChrome({
  onNavigate: (direction) => application.contentWindow.history.go(direction),
  onRefresh: refreshApplication,
  root,
  accessibility: isAccessibility,
  showAnnouncements: new URLSearchParams(location.search).has('announcements'),
  theme,
  change: {
    kind:
      { feature: 'Feature', fix: 'Fix', bug: 'Bug' }[
        new URLSearchParams(location.search).get('kind')
      ] ?? 'Feature',
    title: isAccessibility ? 'Make keyboard interactions visible' : 'Responsive collection lists',
    description: isAccessibility
      ? 'Follow keyboard input and movement announcements.'
      : 'Browse and manage content on desktop, tablet, and mobile.',
  },
})
application.slot = 'content'
application.title = 'Responsive sample application'
application.src = isAccessibility
  ? '/preview/accessibility-application.html'
  : '/preview/application.html'
bindDemoHistory({ app: application, chrome })
let stopAccessibility
if (isAccessibility)
  application.addEventListener('load', () => {
    stopAccessibility?.()
    stopAccessibility = observeAccessibility({
      window: application.contentWindow,
      report: (state) => chrome.setAccessibilityState(state),
    })
  })
function applyTheme() {
  chrome.setTheme(theme)
  document.documentElement.style.colorScheme = theme
  if (application.contentDocument?.body) {
    application.contentDocument.body.style.colorScheme = theme
  }
  document.querySelectorAll('[data-theme]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === theme))
  })
}
application.addEventListener('load', applyTheme)
document.querySelectorAll('[data-theme]').forEach((button) => {
  button.addEventListener('click', () => {
    theme = button.dataset.theme
    const url = new URL(location.href)
    url.searchParams.set('theme', theme)
    history.replaceState(null, '', url)
    applyTheme()
  })
})
applyTheme()
const changeKind = document.querySelector('#change-kind')
changeKind.value = new URLSearchParams(location.search).get('kind') ?? 'feature'
changeKind.addEventListener('change', () => {
  const url = new URL(location.href)
  url.searchParams.set('kind', changeKind.value)
  location.href = url.href
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

const steps = [
  {
    title: 'See the full picture',
    body: 'View post titles, publishing status, and update dates together.',
  },
  {
    kind: 'Bug',
    title: 'Keep essential details visible',
    body: 'Update dates hide as space narrows; titles and status remain.',
  },
  {
    title: 'Make room for content',
    body: 'The sidebar collapses so the post list can use the full width.',
  },
]
const manySteps = document.querySelector('#many-steps')
manySteps.checked = new URLSearchParams(location.search).has('manySteps')
if (manySteps.checked) {
  steps.push(
    {
      title: 'Review field spacing',
      body: 'Check that labels and values have room at smaller widths.',
    },
    {
      title: 'Inspect the collection navigation',
      body: 'Keep the collection links available while browsing content.',
    },
    {
      title: 'Compare publishing statuses',
      body: 'Published and draft items stay easy to distinguish.',
    },
    {
      kind: 'Bug',
      title: 'Check longer document titles',
      body: 'Long names should remain readable within the list.',
    },
    { title: 'Review row actions', body: 'Keep the actions close to the document they belong to.' },
    {
      title: 'Inspect the mobile layout',
      body: 'Confirm the list makes good use of a narrow window.',
    },
    {
      title: 'Return to the collection overview',
      body: 'Review the overall layout after checking individual details.',
    },
    {
      title: 'Compare the available themes',
      body: 'Check text and controls against both light and dark backgrounds.',
    },
    {
      title: 'Finish the walkthrough',
      body: 'The current step stays visible while earlier steps remain available above.',
    },
  )
}
manySteps.addEventListener('change', () => {
  const url = new URL(location.href)
  if (manySteps.checked) url.searchParams.set('manySteps', '')
  else url.searchParams.delete('manySteps')
  location.href = url.href
})
const layoutControl = document.querySelector('#annotation-layout')
layoutControl.hidden = isAccessibility
const sidebar = mountAnnotationSidebar({
  root,
  steps,
  onSelect: (index) => {
    renderAt({
      milliseconds: manySteps.checked
        ? (index * timelineDuration) / steps.length + 1
        : [0, tabletArrival, mobileArrival][index],
    })
    stop()
  },
})
layoutControl.addEventListener('change', () => renderAt({ milliseconds: time }))

function renderAt({ milliseconds }) {
  time = Math.max(0, Math.min(timelineDuration, milliseconds))
  const isFirstResize = time <= tabletArrival
  const progress = Math.max(0, Math.min(1, (time - (isFirstResize ? 400 : tabletDeparture)) / 1200))
  const eased = progress * progress * (3 - 2 * progress)
  width = Math.round(isFirstResize ? 1280 - 512 * eased : 768 - 378 * eased)
  chrome.setViewport({ width, height: 720 })
  const stepIndex = manySteps.checked
    ? Math.min(steps.length - 1, Math.floor((time / timelineDuration) * steps.length))
    : time < tabletArrival
      ? 0
      : time < mobileArrival
        ? 1
        : 2
  const step = { ...steps[stepIndex], index: stepIndex + 1 }
  chrome.setAnnotation(
    document.querySelector('#annotation').checked
      ? isAccessibility
        ? {
            index: 1,
            total: 1,
            title: 'Try it with the keyboard',
            body: 'Click a Move down button, then use Tab and Enter. Commands and announcements appear below this step.',
          }
        : { ...step, total: steps.length }
      : null,
  )
  sidebar.update({
    index: stepIndex,
    width,
    height: 720,
    enabled: !isAccessibility && layoutControl.value !== 'top',
    visible: document.querySelector('#annotation').checked,
  })
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
document
  .querySelector('#annotation')
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

let isRefreshing = false
const simulateRefresh = document.querySelector('#simulate-refresh')
simulateRefresh.addEventListener('click', () => refreshApplication({ minimumDuration: 1200 }))

async function refreshApplication({ minimumDuration = 300 } = {}) {
  if (isRefreshing) return
  isRefreshing = true
  simulateRefresh.setAttribute('aria-disabled', 'true')
  chrome.setRefreshState({ state: 'refreshing' })
  try {
    const started = performance.now()
    const loaded = new Promise((resolve) =>
      application.addEventListener('load', resolve, { once: true }),
    )
    application.contentWindow.location.reload()
    await loaded
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, minimumDuration - (performance.now() - started))),
    )
    chrome.setRefreshState({ state: 'refreshed' })
  } catch {
    chrome.setRefreshState({ state: 'failed' })
  } finally {
    isRefreshing = false
    simulateRefresh.setAttribute('aria-disabled', 'false')
  }
}
