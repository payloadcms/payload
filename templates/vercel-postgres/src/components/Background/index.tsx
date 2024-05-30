import React from 'react'

import styles from './styles.module.scss'

export const Background = () => {
  return (
    <div className={styles.background}>
      <div className={styles.gridlineContainer}>
        <div className={styles.hideMed} />
        <div className={styles.hideMed} />
        <div className={styles.hideSmall} />
        <div />
      </div>
      <div className={styles.blur} />
      <div className={styles.gradient} />
    </div>
  )
}
