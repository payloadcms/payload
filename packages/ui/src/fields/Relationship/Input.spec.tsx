import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { RelationshipInput } from './Input.js'

const state = vi.hoisted(() => ({
  branch: 'first',
  relations: ['posts'],
  collection: {
    slug: 'posts',
    admin: { useAsTitle: 'title' },
    fields: [],
    labels: { plural: 'Posts' },
  },
  config: { admin: {}, routes: { api: '/api' } },
  i18n: { language: 'en', t: (key: string) => key },
  permissions: { collections: { posts: { read: true } } },
}))

vi.mock('../../providers/Branch/index.js', () => ({ useBranchParam: () => state.branch }))
vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({ config: state.config, getEntityConfig: () => state.collection }),
}))
vi.mock('../../providers/Auth/index.js', () => ({
  useAuth: () => ({ permissions: state.permissions }),
}))
vi.mock('../../providers/Locale/index.js', () => ({ useLocale: () => null }))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: state.i18n, t: state.i18n.t }),
}))
vi.mock('../../providers/DocumentEvents/index.js', () => ({ useDocumentEvents: () => ({}) }))
vi.mock('../../elements/DocumentDrawer/index.js', () => ({
  useDocumentDrawer: () => [() => null, null, {}],
}))
vi.mock('../../elements/ListDrawer/index.js', () => ({
  useListDrawer: () => [() => null, null, {}],
}))
vi.mock('../../elements/RenderCustomComponent/index.js', () => ({
  RenderCustomComponent: () => null,
}))
vi.mock('../../elements/ReactSelect/index.js', () => ({
  ReactSelect: ({ onMenuOpen, onMenuClose, options }) => (
    <>
      <button onClick={onMenuOpen} type="button">
        Open
      </button>
      <button onClick={onMenuClose} type="button">
        Close
      </button>
      <output>
        {options.flatMap(({ options }) => options.map(({ label }) => label)).join(',')}
      </output>
    </>
  ),
}))

beforeEach(() => {
  state.branch = 'first'
  vi.stubGlobal('process', { env: {} })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, options) => {
      const branch = new URLSearchParams(options.body).get('branch')
      return Response.json({ docs: [{ id: 'post-1', title: branch }], nextPage: null })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

test('should fetch on first open and reload after a branch change while closed', async () => {
  const screen = await render(<Fixture />)
  await screen.getByRole('button', { name: 'Open', exact: true }).click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('first')
  await screen.getByRole('button', { name: 'Close', exact: true }).click()

  state.branch = 'second'
  await screen.rerender(<Fixture />)
  await screen.getByRole('button', { name: 'Open', exact: true }).click()
  await expect.element(screen.getByRole('status')).toHaveTextContent('second')
  await expect.element(screen.getByRole('status')).not.toHaveTextContent('first')
})

function Fixture() {
  return (
    <RelationshipInput
      allowCreate={false}
      hasMany={false}
      onChange={() => {}}
      path="relation"
      relationTo={state.relations}
      value={null}
    />
  )
}
