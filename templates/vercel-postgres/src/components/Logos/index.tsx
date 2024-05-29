import Image from 'next/image'
import React from 'react'

import styles from './styles.module.scss'

export const Logos = () => {
  return (
    <div className={styles.logos}>
      <Image
        alt="Payload Logo"
        className={styles.payloadLogo}
        height={100}
        priority
        src="/payload.svg"
        width={200}
      />
      <Image alt="" height={20} src="/crosshair.svg" width={20} />
      <Image
        alt="Next.js Logo"
        className={styles.nextLogo}
        height={80}
        priority
        src="/next.svg"
        width={394}
      />
    </div>
  )
}
