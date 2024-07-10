import React from 'react'

import { Page } from '@payload-types'

export const RenderPage = ({ data }: { data: Page }) => {
  return (
    <>
      <h2>Here you can decide how you would like to render the page data!</h2>
      <code>{JSON.stringify(data)}</code>
    </>
  )
}
