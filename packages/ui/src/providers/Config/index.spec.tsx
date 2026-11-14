import type { ClientConfig } from 'payload'

import { useEffect } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { configure } from 'vitest-browser-react/pure'

import type { ClientConfigContext } from './index.js'

import { ConfigProvider, PageConfigProvider, useConfig } from './index.js'

// StrictMode intentionally mounts components twice, which would hide the remount under test.
configure({ reactStrictMode: false })

const unauthenticatedConfig = {
  collections: [],
  globals: [],
  unauthenticated: true,
} as unknown as ClientConfig

const authenticatedConfig = {
  collections: [{ slug: 'posts' }],
  globals: [{ slug: 'settings' }],
} as unknown as ClientConfig

describe('PageConfigProvider', () => {
  test('should not remount children when the root config changes from unauthenticated to authenticated', async () => {
    const onMount = vi.fn()
    const onUnmount = vi.fn()

    const screen = await render(
      <ConfigProvider config={unauthenticatedConfig}>
        <RootConfigStatus />
        <PageConfigProvider config={authenticatedConfig}>
          <MountProbe onMount={onMount} onUnmount={onUnmount} />
        </PageConfigProvider>
      </ConfigProvider>,
    )

    await expect
      .element(screen.getByRole('status', { name: 'Root config' }))
      .toHaveTextContent('authenticated')

    expect(onMount).toHaveBeenCalledTimes(1)
    expect(onUnmount).not.toHaveBeenCalled()
  })

  test('should provide the authenticated config while the root config is stale', async () => {
    const contexts: ClientConfigContext[] = []

    const screen = await render(
      <ConfigProvider config={unauthenticatedConfig}>
        <RootConfigStatus />
        <PageConfigProvider config={authenticatedConfig}>
          <ContextRecorder contexts={contexts} />
        </PageConfigProvider>
      </ConfigProvider>,
    )

    await expect
      .element(screen.getByRole('status', { name: 'Root config' }))
      .toHaveTextContent('authenticated')

    expect(contexts.length).toBeGreaterThan(0)

    for (const context of contexts) {
      expect(context.config).toBe(authenticatedConfig)
      expect(context.getEntityConfig({ collectionSlug: 'posts' })).toBe(
        authenticatedConfig.collections[0],
      )
      expect(context.getEntityConfig({ globalSlug: 'settings' })).toBe(
        authenticatedConfig.globals[0],
      )
    }
  })

  test('should reuse the root context when the root config is already current', async () => {
    const rootContexts: ClientConfigContext[] = []
    const pageContexts: ClientConfigContext[] = []
    const onMount = vi.fn()
    const onUnmount = vi.fn()

    const screen = await render(
      <ConfigProvider config={authenticatedConfig}>
        <ContextRecorder contexts={rootContexts} />
        <RootConfigStatus />
        <PageConfigProvider config={authenticatedConfig}>
          <ContextRecorder contexts={pageContexts} />
          <MountProbe onMount={onMount} onUnmount={onUnmount} />
        </PageConfigProvider>
      </ConfigProvider>,
    )

    await expect
      .element(screen.getByRole('status', { name: 'Root config' }))
      .toHaveTextContent('authenticated')

    expect(pageContexts.at(-1)).toBe(rootContexts.at(-1))
    expect(pageContexts.at(-1)?.config).toBe(authenticatedConfig)
    expect(onMount).toHaveBeenCalledTimes(1)
    expect(onUnmount).not.toHaveBeenCalled()
  })
})

function RootConfigStatus() {
  const { config } = useConfig()

  return (
    <output aria-label="Root config" role="status">
      {config.unauthenticated ? 'unauthenticated' : 'authenticated'}
    </output>
  )
}

function MountProbe({ onMount, onUnmount }: { onMount: () => void; onUnmount: () => void }) {
  useEffect(() => {
    onMount()

    return onUnmount
  }, [onMount, onUnmount])

  return null
}

function ContextRecorder({ contexts }: { contexts: ClientConfigContext[] }) {
  contexts.push(useConfig())

  return null
}
