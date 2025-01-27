import React from 'react'
import { CookiesProvider } from 'react-cookie'
import App, { AppContext, AppProps as NextAppProps } from 'next/app'

import { Header } from '../components/Header'
import { MainMenu } from '../payload-types'

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
  appProps: AppProps & {
    globals: IGlobals
  },
): React.ReactElement => {
  const { Component, pageProps, globals } = appProps

  return (
    <CookiesProvider>
      <Header globals={globals} />
      {/* typescript flags this `@ts-expect-error` declaration as unneeded, but types are breaking the build process
      Remove these comments when the issue is resolved
      See more here: https://github.com/facebook/react/issues/24304
      */}
      {/* @ts-expect-error */}
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
