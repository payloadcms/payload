import { DefaultNav } from '@payloadcms/next/rsc'
import React from 'react'

const Page = async () => {
  await new Promise((resolve) => setTimeout(resolve, 400))

  return (
    <div style={{ position: 'relative' }}>
      <DefaultNav />
    </div>
  )
}

export default Page
