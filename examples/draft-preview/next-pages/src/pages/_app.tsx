import type { AppContext, AppProps as NextAppProps } from 'next/app'

import App from 'next/app'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { CookiesProvider } from 'react-cookie'

import type { MainMenu } from '../payload-types'

import { Header } from '../components/Header'
import './app.scss'

export interface IGlobals {
  mainMenu: MainMenu
}

export const getAllGlobals = async (): Promise<IGlobals> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/globals/main-menu?depth=1`)
  const mainMenu = await res.json()

  return {
    mainMenu,
  }
}

type AppProps<P = any> = {
  pageProps: P
} & Omit<NextAppProps<P>, 'pageProps'>

const PayloadApp = (
  appProps: {
    globals: IGlobals
  } & AppProps,
): React.ReactElement => {
  const { Component, globals, pageProps } = appProps

  const { id, collection, preview } = pageProps

  const router = useRouter()

  const onPreviewExit = useCallback(() => {
    const exit = async () => {
      const exitReq = await fetch('/api/exit-preview')
      if (exitReq.status === 200) {
        router.reload()
      }
    }
    exit().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to exit preview:', error)
    })
  }, [router])

  return (
    <CookiesProvider>
      <Header
        adminBarProps={{
          id,
          collection,
          onPreviewExit,
          preview,
        }}
        globals={globals}
      />
      {/* typescript flags this `@ts-expect-error` declaration as unneeded, but types are breaking the build process
      Remove these comments when the issue is resolved
      See more here: https://github.com/facebook/react/issues/24304
      */}
      <Component {...pageProps} />
    </CookiesProvider>
  )
}

PayloadApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext)

  const globals = await getAllGlobals()

  return {
    ...appProps,
    globals,
  }
}

export default PayloadApp
