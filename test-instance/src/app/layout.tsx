import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Payload Test Instance',
  description: 'Payload CMS test instance with GCS and MCP server',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
