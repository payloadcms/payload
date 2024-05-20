import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import React from 'react'

import type { MainMenu } from '../../payload-types'

import { CloseModalOnRouteChange } from '../../components/CloseModalOnRouteChange'
import { Header } from '../../components/Header'
import '../../css/app.scss'
import { GlobalsProvider } from '../../providers/Globals'

export interface IGlobals {
  mainMenu: MainMenu
}

export const metadata = {
  description: 'An example of how to authenticate with Payload from a Next.js app.',
  title: 'Payload Auth + Next.js App Router Example',
}

export const getAllGlobals = async (): Promise<IGlobals> => {
  const [mainMenu] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/globals/main-menu?depth=1`).then((res) =>
      res.json(),
    ),
  ])

  return {
    mainMenu,
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const globals = await getAllGlobals()

  return (
    <html lang="en">
      <body>
        <React.Fragment>
          <GlobalsProvider {...globals}>
            <ModalProvider classPrefix="form" transTime={0} zIndex="var(--modal-z-index)">
              <CloseModalOnRouteChange />
              <Header />
              {/* <Component {...pageProps} /> */}
              {children}
              <ModalContainer />
            </ModalProvider>
          </GlobalsProvider>
        </React.Fragment>
      </body>
    </html>
  )
}
