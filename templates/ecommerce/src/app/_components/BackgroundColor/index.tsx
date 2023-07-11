'use client'

import React, { createContext, useContext } from 'react'

import classes from './index.module.scss'

export type BackgroundColorType = 'white' | 'black'

export const BackgroundColorContext = createContext<BackgroundColorType>('white')

export const useBackgroundColor = (): BackgroundColorType => useContext(BackgroundColorContext)

type Props = {
  color?: BackgroundColorType
  className?: string
  children?: React.ReactNode
  id?: string
}

export const BackgroundColor: React.FC<Props> = props => {
  const { id, className, children, color = 'white' } = props

  return (
    <div id={id} className={[classes[color], className].filter(Boolean).join(' ')}>
      <BackgroundColorContext.Provider value={color}>{children}</BackgroundColorContext.Provider>
    </div>
  )
}
