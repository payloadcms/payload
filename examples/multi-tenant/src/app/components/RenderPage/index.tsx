import { Fragment } from 'react'
import type { Page } from '@payload-types'

export const RenderPage = ({ data }: { data: Page }) => {
  return (
    <Fragment>
      <h2>Here you can decide how you would like to render the page data!</h2>
      <code>{JSON.stringify(data)}</code>
    </Fragment>
  )
}
