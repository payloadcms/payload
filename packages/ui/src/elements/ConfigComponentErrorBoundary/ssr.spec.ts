import { PassThrough } from 'node:stream'
import React from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { expect, test, vi } from 'vitest'

import { RenderServerComponent } from '../RenderServerComponent/index.js'
import { ConfigComponentErrorBoundary } from './index.js'

vi.mock('../../exports/client/index.js', async () => ({
  ConfigComponentErrorBoundary: (await import('./index.js')).ConfigComponentErrorBoundary,
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: () => 'An error has occurred.' }),
}))

test('should preserve sibling HTML when an injected component throws during streaming SSR', async () => {
  const onError = vi.fn()
  const html = await new Promise<string>((resolve, reject) => {
    const output = new PassThrough()
    let html = ''

    output.on('data', (chunk: Buffer) => {
      html += chunk.toString()
    })
    output.on('end', () => resolve(html))
    output.on('error', reject)
    const stream = renderToPipeableStream(
      React.createElement(
        React.Fragment,
        null,
        React.createElement('p', null, 'Healthy SSR sibling'),
        React.createElement(ConfigComponentErrorBoundary, {
          componentName: 'SSR test',
          children: React.createElement(Broken),
        }),
      ),
      {
        onError,
        onShellError: reject,
        onShellReady: () => stream.pipe(output),
      },
    )
  })

  expect(html).toContain('Healthy SSR sibling')
  expect(html).toContain('template')
  expect(onError).toHaveBeenCalledTimes(1)
  expect(onError.mock.calls[0][0]).toEqual(
    expect.objectContaining({ message: 'SSR component failed' }),
  )
})

test('should avoid inspecting names on server-side client references and omit server props', () => {
  const ClientReference = new Proxy(() => null, {
    get: (target, property) => {
      if (property === '$$typeof') {
        return Symbol.for('react.client.reference')
      }
      if (property === 'name' || property === 'displayName') {
        throw new Error('Cannot inspect a client reference on the server')
      }
      return Reflect.get(target, property)
    },
  })
  const node = RenderServerComponent({
    clientProps: { visible: 'client value' },
    Component: ClientReference,
    importMap: {},
    serverProps: { secret: 'server value' },
  }) as React.ReactElement<{ children: React.ReactElement; componentName: string }>

  expect(node.props.componentName).toBe('configured client component')
  expect(node.props.children.props).toEqual({ visible: 'client value' })
})

function Broken(): React.ReactNode {
  throw new Error('SSR component failed')
}
