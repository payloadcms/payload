import React from 'react'

export const HR: React.FC<{
  className?: string
}> = (props) => {
  const { className } = props

  return <hr className={[className, ''].filter(Boolean).join(' ')} />
}
