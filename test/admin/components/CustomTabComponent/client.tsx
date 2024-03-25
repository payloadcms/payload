'use client'

import LinkImport from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const CustomTabComponentClient: React.FC<{
  path: string
}> = (props) => {
  const { path } = props
  const pathname = usePathname()

  return <Link href={`${pathname}${path}`}>Custom Tab Component</Link>
}
