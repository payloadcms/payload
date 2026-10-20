import type { LinkAdapterProps, RouterAdapterRouter } from 'payload'
import type React from 'react'

import { en } from '@payloadcms/translations/languages/en'
import { pl } from '@payloadcms/translations/languages/pl'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { RouterAdapterContext } from '../../providers/RouterAdapter/index.js'
import { ServerFunctionsProvider } from '../../providers/ServerFunctions/index.js'
import { TranslationProvider } from '../../providers/Translation/index.js'
import { LoadMoreRow } from './index.js'

const router: RouterAdapterRouter = {
  back: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}

const TestLink = ({ href, ...props }: LinkAdapterProps) => <a href={href} {...props} />

const renderWithLanguage = (language: typeof en, children: React.ReactNode) =>
  render(
    <RouterAdapterContext
      value={{
        Link: TestLink,
        params: {},
        pathname: '/',
        router,
        searchParams: new URLSearchParams(),
      }}
    >
      <ServerFunctionsProvider serverFunction={vi.fn()}>
        <TranslationProvider
          dateFNSKey="en-US"
          fallbackLang="en"
          language="en"
          languageOptions={[]}
          translations={language.translations}
        >
          {children}
        </TranslationProvider>
      </ServerFunctionsProvider>
    </RouterAdapterContext>,
  )

test('should render the loaded count in English', async () => {
  const screen = await renderWithLanguage(
    en,
    <LoadMoreRow currentCount={10} hasMore onLoadMore={vi.fn()} totalDocs={25} />,
  )

  await expect.element(screen.getByText('Showing 10 of 25', { exact: false })).toBeVisible()
})

test('should translate the loaded count', async () => {
  const screen = await renderWithLanguage(
    pl,
    <LoadMoreRow currentCount={10} hasMore onLoadMore={vi.fn()} totalDocs={25} />,
  )

  await expect.element(screen.getByText('Wyświetlono 10 z 25', { exact: false })).toBeVisible()
  await expect.element(screen.getByText('Showing', { exact: false })).not.toBeInTheDocument()
})

test('should translate the count when everything is loaded', async () => {
  const screen = await renderWithLanguage(
    pl,
    <LoadMoreRow currentCount={25} hasMore={false} totalDocs={25} />,
  )

  await expect.element(screen.getByText('Wyświetlono 25 z 25')).toBeVisible()
})
