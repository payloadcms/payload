import { Footer } from './_components/Footer'
import { Header } from './_components/Header'
import './_css/app.scss'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payload Live Preview',
  description: 'Payload Live Preview',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
