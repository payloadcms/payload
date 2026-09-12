import type { Metadata } from 'next'
import React from 'react'
import '../../styles/tokens.css'
import '../../components/blocks/blocks.css'

export const metadata: Metadata = {
  description: 'A Payload fullstack starter application.',
  title: 'Payload Fullstack Template',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>
}
