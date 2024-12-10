import React from 'react'

import './index.scss'

const baseClass = 'template-minimal'

export type MinimalTemplateProps = {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  width?: 'normal' | 'wide'
}

export const MinimalTemplate: React.FC<MinimalTemplateProps> = (props) => {
  const { children, className, style = {}, width = 'normal' } = props

  const classes = [className, baseClass, `${baseClass}--width-${width}`].filter(Boolean).join(' ')

  return (
    <section className={classes} style={style}>
      <div className={`${baseClass}__wrap`}>{children}</div>
    </section>
  )
}
