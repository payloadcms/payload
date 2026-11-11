import type { ClientConfig, FormState, LinkAdapterProps } from 'payload'
import type { ReactNode } from 'react'

import { en } from '@payloadcms/translations/languages/en'
import { fr } from 'date-fns/locale/fr'
import { afterEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ConfigProvider } from '../../providers/Config/index.js'
import { RouterAdapterContext } from '../../providers/RouterAdapter/index.js'
import { ServerFunctionsProvider } from '../../providers/ServerFunctions/index.js'
import { TranslationProvider, useTranslation } from '../../providers/Translation/index.js'
import { UploadHandlersProvider } from '../../providers/UploadHandlers/index.js'
import { CreateFirstUserClient } from '../../views/CreateFirstUser/index.client.js'
import { LoginForm } from '../../views/Login/LoginForm/index.js'

const { importLocale, post, setUser } = vi.hoisted(() => ({
  importLocale: vi.fn(),
  post: vi.fn(),
  setUser: vi.fn(),
}))

vi.mock('@payloadcms/translations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@payloadcms/translations')>()),
  importDateFNSLocale: importLocale,
}))

vi.mock('../../providers/Auth/index.js', () => ({
  useAuth: () => ({ refreshCookie: () => undefined, setUser, user: null }),
}))

vi.mock('../../providers/DocumentInfo/index.js', () => ({
  DocumentInfoProvider: ({ children }: { children: ReactNode }) => children,
  useDocumentInfo: () => ({
    collectionSlug: 'users',
    data: {},
    docConfig: { auth: {}, fields: [] },
    docPermissions: { fields: true },
    getDocPreferences: async () => ({ fields: {} }),
  }),
}))

vi.mock('../../utilities/api.js', () => ({ requests: { post } }))

vi.mock('../RenderFields/index.js', () => ({ RenderFields: () => null }))

const config = {
  admin: { routes: { forgot: '/forgot' }, user: 'users' },
  collections: [{ slug: 'users', auth: {}, fields: [] }],
  globals: [],
  routes: { admin: '/admin', api: '/api' },
} as unknown as ClientConfig

const initialState: FormState = {
  email: { initialValue: 'editor@example.com', valid: true, value: 'editor@example.com' },
  password: { initialValue: 'password', valid: true, value: 'password' },
  'confirm-password': { initialValue: 'password', valid: true, value: 'password' },
}

const Link = ({ children, href }: LinkAdapterProps) => <a href={href}>{children}</a>

const LocaleStatus = () => {
  const { i18n } = useTranslation()

  return <output aria-label="Loaded date locale">{i18n.dateFNS?.code ?? 'loading'}</output>
}

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

test.each(['login', 'first user'] as const)(
  'should complete %s when its date locale loads during submission',
  async (view) => {
    vi.stubGlobal('process', { env: { NEXT_BASE_PATH: '' } })

    const locale = Promise.withResolvers<typeof fr>()
    const response = Promise.withResolvers<Response>()
    const push = vi.fn()

    importLocale.mockReturnValue(locale.promise)
    post.mockReturnValue(response.promise)

    const screen = await render(
      <RouterAdapterContext
        value={{
          Link,
          params: {},
          pathname: '/admin/login',
          router: { back: vi.fn(), push, refresh: vi.fn(), replace: vi.fn() },
          searchParams: new URLSearchParams(),
        }}
      >
        <ConfigProvider config={config}>
          <ServerFunctionsProvider serverFunction={async ({ args }) => ({ state: args.formState })}>
            <TranslationProvider
              dateFNSKey="fr"
              fallbackLang="en"
              language="en"
              languageOptions={[]}
              translations={en.translations}
            >
              <UploadHandlersProvider>
                <LocaleStatus />
                {view === 'login' ? (
                  <LoginForm
                    prefillEmail="editor@example.com"
                    prefillPassword="password"
                    searchParams={{}}
                  />
                ) : (
                  <CreateFirstUserClient
                    docPermissions={{ fields: true }}
                    docPreferences={{ fields: {} }}
                    initialState={initialState}
                    userSlug="users"
                  />
                )}
              </UploadHandlersProvider>
            </TranslationProvider>
          </ServerFunctionsProvider>
        </ConfigProvider>
      </RouterAdapterContext>,
    )

    await expect
      .element(screen.getByRole('status', { name: 'Loaded date locale' }))
      .toHaveTextContent('loading')
    await screen
      .getByRole('button', { name: view === 'login' ? 'Login' : 'Create user', exact: true })
      .click()
    await expect.poll(() => post.mock.calls.length).toBe(1)

    locale.resolve(fr)

    await expect
      .element(screen.getByRole('status', { name: 'Loaded date locale' }))
      .toHaveTextContent('fr')

    const user = { id: 'user-1', email: 'editor@example.com' }
    const result = { user, token: 'token' }

    response.resolve(Response.json(result, { status: view === 'login' ? 200 : 201 }))

    await expect.poll(() => setUser.mock.calls).toEqual([[result]])
    await expect.poll(() => push.mock.calls).toEqual([['/admin']])
  },
)
