import React from 'react'

import './index.css'

const paths = {
  24: 'M9 5.5a.5.5 0 0 1 1 0V7h3.5a.5.5 0 0 1 0 1h-1.282l-.054.16c-.503 1.488-1.086 2.54-2.03 3.708l1.527 1.907a.5.5 0 1 1-.781.625l-1.407-1.758c-.689.77-1.54 1.63-2.62 2.711a.5.5 0 1 1-.707-.706c1.146-1.148 2.013-2.028 2.693-2.798L7.21 9.812a.5.5 0 0 1 .781-.624l1.504 1.879c.773-.986 1.248-1.869 1.668-3.067H5.5a.5.5 0 0 1 0-1H9zm5.039 5.808A.5.5 0 0 1 14.5 11h.5a.5.5 0 0 1 .461.308l1.667 4 .834 2a.5.5 0 1 1-.924.384L16.334 16h-3.166l-.706 1.692a.5.5 0 1 1-.922-.384l.833-2zM15.917 15l-1.167-2.8-1.167 2.8z',
}

/**
 * Language/translate icon (only 24px variant exists in FPL)
 * Keywords: translate, translation, multilingual, localization, global, international, text
 */
export const LanguageIcon: React.FC<{
  readonly className?: string
  readonly size?: 24
}> = ({ className, size = 24 }) => {
  return (
    <svg
      className={['icon', 'icon--language', className].filter(Boolean).join(' ')}
      fill="none"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
