import { readFile } from 'node:fs/promises'

/** Mounts the live application inside the same browser page that records the chrome. */
export async function createPresentation({
  page: stage,
  options,
  viewport,
  baseURL = 'http://localhost:3000',
  pauseScale,
  startedAt = performance.now(),
}) {
  const wrapperURL = new URL('/__payload_pr_demo_chrome__', baseURL).href
  const wrapper = (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html data-pr-demo-stage><head><meta charset="utf-8"><title>Demo recording</title><style>body{margin:0}</style></head><body><div id="demo-stage"></div></body></html>',
    })
  if (options.accessibility) {
    const observerSource = await readFile(
      new URL('./accessibility-demo.mjs', import.meta.url),
      'utf8',
    )
    await stage.context().addInitScript({
      content: `${observerSource.replace('export function', 'function')}
      if (window.name === 'pr-demo-app' && window.parent !== window) {
        window.__stopDemoAccessibility = observeAccessibility({ report: state => window.parent.postMessage({ type: 'payload-demo-accessibility', state }, '*') })
      }`,
    })
  }
  await stage.route(wrapperURL, wrapper)
  try {
    await stage.goto(wrapperURL)
    const source = await readFile(new URL('./WindowChrome/index.mjs', import.meta.url), 'utf8')
    await stage.evaluate(
      async ({ source, options, viewport, shouldAnimateAnnotations }) => {
        const { mountDemoChrome } = await import(`data:text/javascript;base64,${source}`)
        const root = document.querySelector('#demo-stage')
        window.demoChrome = mountDemoChrome({
          ...options,
          root,
          viewport,
          shouldAnimateAnnotations,
        })
        const app = document.createElement('iframe')
        app.setAttribute('data-pr-demo-app', '')
        app.name = 'pr-demo-app'
        app.title = 'Payload application'
        app.slot = 'content'
        if (options.accessibility) {
          window.demoAccessibilityListener = (event) => {
            if (
              event.source === app.contentWindow &&
              event.data?.type === 'payload-demo-accessibility'
            ) {
              window.demoChrome.setAccessibilityState(event.data.state)
            }
          }
          window.addEventListener('message', window.demoAccessibilityListener)
        }
        root.append(app)
      },
      {
        source: Buffer.from(source).toString('base64'),
        options,
        viewport,
        shouldAnimateAnnotations: pauseScale > 0,
      },
    )

    const handle = await stage.locator('[data-pr-demo-app]').elementHandle()
    const frame = await handle.contentFrame()
    await handle.dispose()
    if (!frame) throw new Error('Could not mount the application iframe')
    const call = ({ method, value }) =>
      stage.evaluate(
        async ({ method, value }) => {
          await window.demoChrome[method](value)
        },
        { method, value },
      )
    let currentViewport = { ...viewport }
    let isResizing = false
    let isRefreshing = false
    const resizeWindow = async ({ width, height, duration = 1000 }) => {
      if (isResizing) throw new Error('Await the previous resizeWindow before starting another')
      isResizing = true
      try {
        await call({
          method: 'animateViewport',
          value: { width, height, duration: duration * pauseScale },
        })
        currentViewport = { width, height }
      } finally {
        isResizing = false
      }
    }
    // Keep locators, navigation and evaluation in the real app frame. Input devices,
    // request events and context-wide init scripts belong to the containing page.
    const appPage = new Proxy(frame, {
      get(target, property) {
        if (property === 'viewportSize') return () => ({ ...currentViewport })
        if (property === 'setViewportSize')
          return (value) => resizeWindow({ ...value, duration: 0 })
        if (property === 'reload')
          return async (options) => {
            if (isRefreshing)
              throw new Error('Await the previous page.reload() before refreshing again')
            isRefreshing = true
            try {
              await call({ method: 'setRefreshState', value: { state: 'refreshing' } })
              await stage.evaluate(
                () =>
                  new Promise((resolve) =>
                    requestAnimationFrame(() => requestAnimationFrame(resolve)),
                  ),
              )
              const started = performance.now()
              const [response] = await Promise.all([
                target.waitForNavigation(options),
                target.evaluate(() => location.reload()),
              ])
              if (response && response.status() >= 400)
                throw new Error(`Refresh failed: HTTP ${response.status()}`)
              await stage.waitForTimeout(
                Math.max(0, 300 * pauseScale - (performance.now() - started)),
              )
              await call({ method: 'setRefreshState', value: { state: 'refreshed' } })
              return response
            } catch (error) {
              await call({ method: 'setRefreshState', value: { state: 'failed' } }).catch(() => {})
              throw error
            } finally {
              isRefreshing = false
            }
          }
        if (property === 'goBack' || property === 'goForward')
          return async () => {
            throw new Error(`${property} is not supported in presentation mode; use page.goto()`)
          }
        if (property === 'addInitScript') return stage.context().addInitScript.bind(stage.context())
        const owner = property in target ? target : stage
        const value = Reflect.get(owner, property)
        return typeof value === 'function' ? value.bind(owner) : value
      },
    })
    return {
      page: stage,
      appPage,
      startedAt,
      resizeWindow,
      setAnnotation: (value) => call({ method: 'setAnnotation', value }),
      clearAnnotation: () => call({ method: 'setAnnotation', value: null }),
      flush: () =>
        stage.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        ),
      stop: async () => {
        if (options.accessibility) {
          await frame.evaluate(() => window.__stopDemoAccessibility?.()).catch(() => {})
          await stage.evaluate(() => {
            window.removeEventListener('message', window.demoAccessibilityListener)
            delete window.demoAccessibilityListener
          })
        }
        await stage.unroute(wrapperURL, wrapper)
      },
    }
  } catch (error) {
    await stage.unroute(wrapperURL, wrapper)
    throw error
  }
}
