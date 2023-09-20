'use client'

import React, { useCallback, useEffect, useState } from 'react'
import styles from './page.module.css'
import { PAYLOAD_SERVER_URL, PageType } from './api'

export type Props = {
  initialPage: PageType
}

export const Page: React.FC<Props> = (props) => {
  const { initialPage } = props
  const [data, setData] = useState<PageType>(initialPage)

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin === PAYLOAD_SERVER_URL && event.data) {
      const eventData = JSON.parse(event?.data)
      if (eventData.type === 'livePreview') {
        setData(eventData?.data)
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return (
    <main className={styles.main}>
      <h1>{data?.title}</h1>
      <p>{data?.description}</p>
    </main>
  )
}
