/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import configPromise from '@payload-config'
import '@payloadcms/next/css'
import { RootLayout } from '@payloadcms/next/layouts'
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { Merriweather } from 'next/font/google'
import React from 'react'

import './custom.scss'

const merriweather = Merriweather({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '900'],
})
type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => (
  <RootLayout config={configPromise} className={merriweather.variable}>
    {children}
  </RootLayout>
)

export default Layout
