'use client'

import React, { useCallback, useEffect, useState } from 'react'
import styles from './page.module.css'

export default function Home() {
  const [fields, setFields] = useState({})

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data) {
      const json = JSON.parse(event.data)
      setFields(json.fields)
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
      <h1>Hello, world!</h1>
      <p>Fields&nbsp;{JSON.stringify(fields)}</p>
    </main>
  )
}
