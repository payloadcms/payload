'use client'

import React, { useCallback, useEffect, useState } from 'react'
import styles from './page.module.css'

export type PageType = {
  title?: string
  description?: string
}

export type Props = {
  initialPage: PageType
}

export const Page: React.FC<Props> = (props) => {
  const { initialPage } = props
  const [data, setData] = useState<PageType>(initialPage)

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data) {
      const message = JSON.parse(event?.data)
      setData(message?.data)
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
