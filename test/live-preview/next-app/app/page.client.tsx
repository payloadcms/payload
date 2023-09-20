'use client'

import React from 'react'
import styles from './page.module.css'
import { PAYLOAD_SERVER_URL, PageType } from './api'
import { useLivePreview } from '../../../../packages/payload/src/admin/components/views/LivePreview/useLivePreview'

export type Props = {
  initialPage: PageType
}

export const Page: React.FC<Props> = (props) => {
  const { initialPage } = props
  const data = useLivePreview({ initialPage, serverURL: PAYLOAD_SERVER_URL })

  return (
    <main className={styles.main}>
      <h1>{data?.title}</h1>
      <p>{data?.description}</p>
    </main>
  )
}
