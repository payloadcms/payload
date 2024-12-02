import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import React from 'react'

import type { MainMenu } from '../../payload-types'

import { CloseModalOnRouteChange } from '../../components/CloseModalOnRouteChange'
import { Header } from '../../components/Header'
import '../../css/app.scss'

export interface IGlobals {
  mainMenu: MainMenu
}

export const metadata = {
  description: 'An example of how to authenticate with Payload from a Next.js app.',
  title: 'Payload Auth + Next.js App Router Example',
}

// eslint-disable-next-line no-restricted-exports, @typescript-eslint/require-await
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <React.Fragment>
          <ModalProvider classPrefix="form" transTime={0} zIndex="var(--modal-z-index)">
            <CloseModalOnRouteChange />
            <Header />
            {/* <Component {...pageProps} /> */}
            {children}
            <ModalContainer />
          </ModalProvider>
        </React.Fragment>
      </body>
    </html>
  )
}
