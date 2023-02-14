import React, { useCallback } from 'react'
import { CookiesProvider } from 'react-cookie'
import App, { AppContext, AppProps as NextAppProps } from 'next/app'
import { useRouter } from 'next/router'

import { Header } from '../components/Header'
import { MainMenu } from '../payload-types'

import '../css/app.scss'

export interface IGlobals {
  mainMenu: MainMenu
}

export const getAllGlobals = async (): Promise<IGlobals> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/globals/main-menu?depth=1`)
  const mainMenu = await res.json()

  return {
    mainMenu,
  }
}

type AppProps<P = any> = {
  pageProps: P
} & Omit<NextAppProps<P>, 'pageProps'>

const PayloadApp = (
  appProps: AppProps & {
    globals: IGlobals
  },
): React.ReactElement => {
  const { Component, pageProps, globals } = appProps

  const { collection, id, preview } = pageProps

  const router = useRouter()

  const onPreviewExit = useCallback(() => {
    const exit = async () => {
      const exitReq = await fetch('/api/exit-preview')
      if (exitReq.status === 200) {
        router.reload()
      }
    }
    exit()
  }, [router])

  return (
    <CookiesProvider>
      <Header
        globals={globals}
        adminBarProps={{
          collection,
          id,
          preview,
          onPreviewExit,
        }}
      />
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
