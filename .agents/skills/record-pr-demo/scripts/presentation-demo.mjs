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
      body: '<!doctype html><html><head><meta charset="utf-8"><title>Demo recording</title><style>body{margin:0}</style></head><body><div id="demo-stage"></div></body></html>',
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
    const sidebarSource = Buffer.from(
      await readFile(new URL('./WindowChrome/sidebar.mjs', import.meta.url)),
    ).toString('base64')
    await stage.evaluate(
      async ({ source, sidebarSource, options, viewport, shouldAnimateAnnotations }) => {
        const { mountDemoChrome, bindDemoHistory } = await import(
          `data:text/javascript;base64,${source}`
        )
        const root = document.querySelector('#demo-stage')
        const app = document.createElement('iframe')
        window.demoChrome = mountDemoChrome({
          ...options,
          onNavigate: (direction) => app.contentWindow.history.go(direction),
          onRefresh: () => window.refreshDemoApplication(),
          root,
          viewport,
          shouldAnimateFeedback: shouldAnimateAnnotations,
        })
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
        window.stopDemoHistory = bindDemoHistory({ app, chrome: window.demoChrome })
        root.append(app)
        const { mountAnnotationSidebar } = await import(
          `data:text/javascript;base64,${sidebarSource}`
        )
        window.demoSidebar = mountAnnotationSidebar({
          root,
          change: options.change,
          steps: options.annotationSteps,
          shouldAnimate: shouldAnimateAnnotations,
        })
      },
      {
        source: Buffer.from(source).toString('base64'),
        sidebarSource,
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
          const target = method === 'setAnnotation' ? window.demoSidebar : window.demoChrome
          await target[method](value)
        },
        { method, value },
      )
    const onAppNavigation = (navigatedFrame) => {
      if (navigatedFrame === frame) {
        void call({ method: 'setURL', value: frame.url() }).catch(() => {
          // Navigation can invalidate a cosmetic URL update; the frame binding also syncs it.
        })
      }
    }
    stage.on('framenavigated', onAppNavigation)
    await call({ method: 'setURL', value: frame.url() })
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
            throw new Error(
              `${property} is not supported in presentation mode; use await click(chrome.${property === 'goBack' ? 'back' : 'forward'})`,
            )
          }
        if (property === 'addInitScript') return stage.context().addInitScript.bind(stage.context())
        const owner = property in target ? target : stage
        const value = Reflect.get(owner, property)
        return typeof value === 'function' ? value.bind(owner) : value
      },
    })
    const refreshBinding = await stage.exposeFunction('refreshDemoApplication', () =>
      appPage.reload(),
    )
    return {
      page: stage,
      appPage,
      chrome: {
        back: stage.getByRole('button', { name: 'Back', exact: true }),
        forward: stage.getByRole('button', { name: 'Forward', exact: true }),
        refresh: stage.getByRole('button', { name: 'Refresh frame', exact: true }),
      },
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
        stage.off('framenavigated', onAppNavigation)
        await refreshBinding?.dispose()
        await stage.evaluate(() => {
          window.stopDemoHistory?.()
          window.demoSidebar?.destroy()
        })
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
