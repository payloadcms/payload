'use client'

import React, { Fragment } from 'react'
import styles from './page.module.css'
import { PAYLOAD_SERVER_URL } from './api'
// The `useLivePreview` hook is imported from the monorepo for development purposes only
// in your own app you would import this hook directly from the package itself
// i.e. `import { useLivePreview } from '@payloadcms/live-preview-react'`
// If you are using another framework, look for the equivalent packages for your framework
import { useLivePreview } from '../../../../packages/live-preview-react'
import { Page as PageType } from '@/payload-types'

export type Props = {
  initialPage: PageType
}

export const Page: React.FC<Props> = (props) => {
  const { initialPage } = props

  const { data, isLoading } = useLivePreview<PageType>({
    initialData: initialPage,
    serverURL: PAYLOAD_SERVER_URL,
  })

  return (
    <main className={styles.main}>
      {isLoading && <Fragment>Loading...</Fragment>}
      {!isLoading && (
        <Fragment>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
          {data.layout && (
            <div>
              <p>Blocks</p>
              <div className={styles.blocks}>
                {data.layout.map((block, index) => {
                  const { title, description } = block
                  return (
                    <div key={index}>
                      <h2>{title}</h2>
                      <p>{description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <br />
          <hr />
          <br />
          {data.featuredPosts && (
            <div>
              <p>Featured Posts</p>
              <ul className={styles['featured-posts']}>
                {data.featuredPosts.map((post, index) => (
                  <li key={index}>{typeof post === 'string' ? post : post.id}</li>
                ))}
              </ul>
            </div>
          )}
        </Fragment>
      )}
    </main>
  )
}
