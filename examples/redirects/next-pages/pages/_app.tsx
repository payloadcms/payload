import React from 'react'
import App, { AppContext, AppProps as NextAppProps } from 'next/app'

import { Header } from '../components/Header'
import { MainMenu } from '../payload-types'
import { GlobalsProvider } from '../providers/Globals'

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

  return (
    <GlobalsProvider {...globals}>
      <Header />
      <Component {...pageProps} />
    </GlobalsProvider>
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
