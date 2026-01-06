import React from 'react'
import { DefaultNav } from './components'

const Page = async () => {
  await new Promise((resolve) => setTimeout(resolve, 400))

  return (
    <div style={{ position: 'relative' }}>
      <DefaultNav />
    </div>
  )
}

export default Page
