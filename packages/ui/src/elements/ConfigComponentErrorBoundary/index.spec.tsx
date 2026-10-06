import type { PropsWithChildren } from 'react'

import React, { lazy } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ErrorBoundary } from 'react-error-boundary'

import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { RenderServerComponent } from '../RenderServerComponent/index.js'
import { RenderClientComponent } from '../RenderServerComponent/clientOnly.js'
import { ConfigComponentErrorBoundary } from './index.js'

vi.mock('../../exports/client/index.js', async () => ({
  ConfigComponentErrorBoundary: (await import('./index.js')).ConfigComponentErrorBoundary,
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: () => 'An error has occurred.' }),
}))

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('should isolate a throwing mapped component and preserve sibling input state', async () => {
  const screen = await render(
    <>
      <label>
        Sibling input
        <input />
      </label>
      {RenderClientComponent({
        Component: ['/components/Broken#Broken', '/components/Healthy#Healthy'],
        importMap: {
          '/components/Broken#Broken': Broken,
          '/components/Healthy#Healthy': Healthy,
        },
      })}
    </>,
  )

  await screen.getByRole('textbox').fill('Unsaved value')
  await expect.element(screen.getByRole('alert')).toHaveTextContent('An error has occurred.')
  await expect.element(screen.getByText('Healthy component')).toBeVisible()
  await expect.element(screen.getByRole('textbox')).toHaveValue('Unsaved value')
  expect(console.error).toHaveBeenCalledWith(
    'Error rendering configured component subtree: /components/Broken#Broken',
    expect.objectContaining({ err: expect.any(Error), instanceKey: expect.any(String) }),
  )
})

test('should isolate raw custom nodes without substituting an action fallback', async () => {
  const screen = await render(
    <RenderCustomComponent CustomComponent={<Broken />} Fallback={<button>Publish</button>} />,
  )

  await expect.element(screen.getByRole('alert')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
})

test('should preserve the accessible label through a nested mapped component failure', async () => {
  const screen = await render(
    <>
      <RenderCustomComponent
        CustomComponent={RenderClientComponent({
          Component: '/components/Label#Label',
          importMap: { '/components/Label#Label': Broken },
        })}
        Fallback={<label htmlFor="label-fallback-input">Title</label>}
        shouldUseFallbackOnError
      />
      <input id="label-fallback-input" />
    </>,
  )

  await expect.element(screen.getByRole('textbox', { name: 'Title' })).toBeVisible()
  await expect.element(screen.getByRole('alert')).not.toBeInTheDocument()
})

test('should preserve undefined and null selection semantics', async () => {
  const screen = await render(
    <>
      <RenderCustomComponent CustomComponent={undefined} Fallback={<span>Default label</span>} />
      <RenderCustomComponent CustomComponent={null} Fallback={<span>Must stay hidden</span>} />
    </>,
  )

  await expect.element(screen.getByText('Default label')).toBeVisible()
  await expect.element(screen.getByText('Must stay hidden')).not.toBeInTheDocument()
  await expect.element(screen.getByRole('alert')).not.toBeInTheDocument()
})

test('should use a compatible explicitly supplied error fallback', async () => {
  const screen = await render(
    <ConfigComponentErrorBoundary componentName="label" errorFallback={<span>Default label</span>}>
      <Broken />
    </ConfigComponentErrorBoundary>,
  )

  await expect.element(screen.getByText('Default label')).toBeVisible()
})

test('should reset after the component instance changes', async () => {
  let shouldThrow = true
  const Component = () => (shouldThrow ? <Broken /> : <Healthy />)
  const screen = await render(
    <ConfigComponentErrorBoundary componentName="field" instanceKey="row-1">
      <Component />
    </ConfigComponentErrorBoundary>,
  )

  await expect.element(screen.getByRole('alert')).toBeVisible()
  shouldThrow = false
  await screen.rerender(
    <ConfigComponentErrorBoundary componentName="field" instanceKey="row-2">
      <Component />
    </ConfigComponentErrorBoundary>,
  )

  await expect.element(screen.getByText('Healthy component')).toBeVisible()
})

test('should reset a mapped component when its document changes without remounting siblings', async () => {
  const Component = ({ docID }: { docID: string }) =>
    docID === 'broken' ? <Broken /> : <Healthy />
  const importMap = { '/components/Document#Document': Component }
  const screen = await render(
    <>
      <input aria-label="Unsaved sibling" />
      {RenderClientComponent({
        Component: '/components/Document#Document',
        importMap,
        clientProps: { docID: 'broken' },
      })}
    </>,
  )

  await expect.element(screen.getByRole('alert')).toBeVisible()
  await screen.getByRole('textbox').fill('Preserved value')
  await screen.rerender(
    <>
      <input aria-label="Unsaved sibling" />
      {RenderClientComponent({
        Component: '/components/Document#Document',
        importMap,
        clientProps: { docID: 'healthy' },
      })}
    </>,
  )

  await expect.element(screen.getByText('Healthy component')).toBeVisible()
  await expect.element(screen.getByRole('textbox')).toHaveValue('Preserved value')
})

test('should recover when the custom component type changes', async () => {
  const screen = await render(
    <RenderCustomComponent CustomComponent={<Broken />} Fallback={null} />,
  )

  await expect.element(screen.getByRole('alert')).toBeVisible()
  await screen.rerender(<RenderCustomComponent CustomComponent={<Healthy />} Fallback={null} />)
  await expect.element(screen.getByText('Healthy component')).toBeVisible()
})

test('should catch rejected lazy components beneath Suspense', async () => {
  const Rejected = lazy(() => Promise.reject(new Error('Failed asynchronous component')))
  const screen = await render(
    <ConfigComponentErrorBoundary componentName="async component">
      <Rejected />
    </ConfigComponentErrorBoundary>,
  )

  await expect.element(screen.getByRole('alert')).toBeVisible()
})

test('should fail a provider subtree without rendering children outside its context', async () => {
  const screen = await render(
    <>
      {RenderClientComponent({
        Component: BrokenProvider,
        importMap: {},
        clientProps: { children: <Healthy /> },
      })}
      <span>Outside provider</span>
    </>,
  )

  await expect.element(screen.getByRole('alert')).toBeVisible()
  await expect.element(screen.getByText('Healthy component')).not.toBeInTheDocument()
  await expect.element(screen.getByText('Outside provider')).toBeVisible()
})

test('should isolate resolved server renderer nodes and retain configured prop precedence', async () => {
  const Component = (props: { client?: string; server?: string }) => (
    <span>{`${props.client}:${props.server}`}</span>
  )
  const screen = await render(
    <>
      {RenderServerComponent({
        clientProps: { client: 'Base client value' },
        Component: {
          path: '/components/WithProps',
          exportName: 'WithProps',
          clientProps: { client: 'Configured client value' },
          serverProps: { server: 'Configured server value' },
        },
        importMap: { '/components/WithProps#WithProps': Component },
        serverProps: { server: 'Base server value' },
      })}
      {RenderServerComponent({
        Component: '/components/Broken#Broken',
        importMap: { '/components/Broken#Broken': Broken },
        Fallback: Healthy,
      })}
    </>,
  )

  await expect
    .element(screen.getByText('Configured client value:Configured server value'))
    .toBeVisible()
  await expect.element(screen.getByRole('alert')).toBeVisible()
  await expect.element(screen.getByText('Healthy component')).not.toBeInTheDocument()
})

test.each([
  'NEXT_REDIRECT;replace;/admin;307;',
  'NEXT_HTTP_ERROR_FALLBACK;401',
  'NEXT_HTTP_ERROR_FALLBACK;403',
  'NEXT_HTTP_ERROR_FALLBACK;404',
])('should defer framework signal %s to the parent boundary', async (digest) => {
  const Component = () => {
    throw Object.assign(new Error('Framework navigation'), { digest })
  }
  const screen = await render(
    <ErrorBoundary fallback={<span>Framework handled navigation</span>}>
      <ConfigComponentErrorBoundary componentName="navigation component">
        <Component />
      </ConfigComponentErrorBoundary>
    </ErrorBoundary>,
  )

  await expect.element(screen.getByText('Framework handled navigation')).toBeVisible()
  await expect.element(screen.getByRole('alert')).not.toBeInTheDocument()
  expect(console.error).not.toHaveBeenCalledWith(
    expect.stringContaining('Error rendering configured component subtree:'),
    expect.anything(),
  )
})

test('should preserve the absence fallback and client prop filtering', async () => {
  const Component = (props: { client?: string; server?: string }) => (
    <span>{`${props.client}:${String(props.server)}`}</span>
  )
  const screen = await render(
    <>
      {RenderClientComponent({
        clientProps: { client: 'Client value' },
        Component: '/components/Test#Test',
        importMap: { '/components/Test#Test': Component },
        serverProps: { server: 'Must not reach the client' },
      })}
      {RenderClientComponent({ importMap: {}, Fallback: Healthy })}
    </>,
  )

  await expect.element(screen.getByText('Client value:undefined')).toBeVisible()
  await expect.element(screen.getByText('Healthy component')).toBeVisible()
})

function Broken(): React.ReactNode {
  throw new Error('Configured component failed')
}

function Healthy() {
  return <span>Healthy component</span>
}

function BrokenProvider({ children: _children }: PropsWithChildren): React.ReactNode {
  throw new Error('Configured provider failed')
}
