import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payload Live Preview',
  description: 'Payload Live Preview',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
