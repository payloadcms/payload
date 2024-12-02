import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import React from 'react'

import { CloseModalOnRouteChange } from '../../components/CloseModalOnRouteChange'
import { Header } from '../../components/Header'
import '../../css/app.scss'

export const metadata = {
  description: 'An example of how to authenticate with Payload from a Next.js app.',
  title: 'Payload Auth + Next.js App Router Example',
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

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
