import type { Metadata } from 'next'

import { Inter } from 'next/font/google'
import React from 'react'

import './globals.scss'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  description: 'A Payload starter project with Next.js, Vercel Postgres, and Vercel Blob Storage.',
  title: 'Payload Vercel Starter',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
