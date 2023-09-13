import React from 'react'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

import { Footer } from './_components/siteLayout/footer'
import { NavBar } from './_components/siteLayout/navBar'
import { Backdrop } from './_components/ui/backdrop/backdrop'
import { ThemeProvider } from './_provider/themeProvider'
import { fetchHeader, fetchProfile, serverUrl } from './_utils/api'

import './globals.css'

export async function generateMetadata() {
  const profile = await fetchProfile()

  return {
    metadataBase: new URL(serverUrl),
    title: `Portfolio | ${profile.name}`,
    description: 'My professional portfolio featuring past projects and contact info.',
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [profile, header] = await Promise.all([fetchProfile(), fetchHeader()])

  return (
    <html lang="en" className={`dark ${inter.className}`}>
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
