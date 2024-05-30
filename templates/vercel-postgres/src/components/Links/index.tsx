import Link from 'next/link'
import React from 'react'

import styles from './styles.module.scss'

export const Links = () => {
  return (
    <div className={styles.links}>
      <Link href="/admin">
        <h6>Admin Panel</h6>
        <span>Manage your site&apos;s content from the admin panel.</span>
        <div className={styles.scanlines} />
      </Link>
      <Link href="https://payloadcms.com/docs">
        <h6>Payload Docs</h6>
        <span>Learn about how to build your backend with Payload.</span>
        <div className={styles.scanlines} />
      </Link>
      <Link href="https://nextjs.org/docs">
        <h6>Next.js Docs</h6>
        <span>Find in-depth information about Next.js features and API.</span>
        <div className={styles.scanlines} />
      </Link>
      <Link href="https://discord.gg/payload">
        <h6>Need help?</h6>
        <span>Join our Discord to ask questions and get help from the community.</span>
        <div className={styles.scanlines} />
      </Link>
    </div>
  )
}
