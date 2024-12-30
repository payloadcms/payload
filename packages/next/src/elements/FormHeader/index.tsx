import React from 'react'

import './index.scss'

const baseClass = 'form-header'

type Props = {
  description?: React.ReactNode | string
  heading: string
}
export function FormHeader({ description, heading }: Props) {
  if (!heading) {
    return null
  }

  return (
    <div className={baseClass}>
      <h1>{heading}</h1>
      {Boolean(description) && <p>{description}</p>}
    </div>
  )
}
