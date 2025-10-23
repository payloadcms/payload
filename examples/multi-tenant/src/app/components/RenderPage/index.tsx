import type { Page } from '@payload-types'

import React from 'react'

export const RenderPage = ({ data }: { data: Page }) => {
  return (
    <React.Fragment>
      <form action="/api/users/logout" method="post">
        <button type="submit">Logout</button>
      </form>
      <h2>Here you can decide how you would like to render the page data!</h2>

      <code>{JSON.stringify(data)}</code>
    </React.Fragment>
  )
}
