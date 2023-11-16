'use client'
import React from 'react'
import { ClientConfig } from 'payload/types'
import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { ScrollInfoProvider } from '@faceless-ui/scroll-info'
import { WindowInfoProvider } from '@faceless-ui/window-info'
import { ConfigProvider } from '../Config'
import I18n from '../../elements/I18n'

type Props = {
  config: ClientConfig
  children: React.ReactNode
}

export const RootProvider: React.FC<Props> = ({ config, children }) => {
  return (
    <ConfigProvider config={config}>
      <I18n config={config} />
      <WindowInfoProvider
        breakpoints={{
          l: '(max-width: 1440px)',
          m: '(max-width: 1024px)',
          s: '(max-width: 768px)',
          xs: '(max-width: 400px)',
        }}
      >
        <ScrollInfoProvider>
          <ModalProvider classPrefix="payload" transTime={0} zIndex="var(--z-modal)">
            {children}
            <ModalContainer />
          </ModalProvider>
        </ScrollInfoProvider>
      </WindowInfoProvider>
    </ConfigProvider>
  )
}
