import styles from './backdrop.module.css'

export const Backdrop = () => {
  return (
    <div
      className={`fixed top-0 left-0 flex w-screen h-screen z-0 overflow-hidden opacity-0 dark:opacity-100`}
    >
      <div className={`${styles.breatheAnimation} ${styles.circleLeft}`} />
      <div className={`${styles.breatheAnimation} ${styles.circleRight}`} />
    </div>
  )
}
