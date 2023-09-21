import React from 'react'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

import { Header, Profile } from '../payload/payload-types'
import { Footer } from './_components/siteLayout/footer'
import { NavBar } from './_components/siteLayout/navBar'
import { Backdrop } from './_components/ui/backdrop/backdrop'
import { ThemeProvider } from './_provider/themeProvider'
import { fetchHeader, fetchProfile } from './_utils/api'

import './globals.css'

export async function generateMetadata() {
  let profile: Profile | null = null

  try {
    profile = await fetchProfile()
  } catch (error) {}

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'https://payloadcms.com'),
    title: `Portfolio | ${profile.name}`,
    description: 'My professional portfolio featuring past projects and contact info.',
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let profile: Profile | null = null
  let header: Header | null = null

  try {
    ;[profile, header] = await Promise.all([fetchProfile(), fetchHeader()])
  } catch (error) {}

  return (
    <html lang="en" className={`${inter.className} dark`}>
      <body className="w-full overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Backdrop />
          <div className="relative z-20 min-h-screen flex flex-col items-center">
            <NavBar profile={profile} header={header} />
            <div
              className="flex flex-col w-full max-w-[1080px] px-7 lg:px-8 xl:px-0 justify-center"
              id="main-content"
            >
              <main>{children}</main>
            </div>
            <Footer profile={profile} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
