import * as React from 'react'

const baseClass = 'minimize-maximize'

type Props = {
  className?: string
  isMinimized?: boolean
}
export const MinimizeMaximize: React.FC<Props> = ({ className, isMinimized }) => {
  const classes = [
    baseClass,
    isMinimized ? `${baseClass}--minimized` : `${baseClass}--maximized`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      className={classes}
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {isMinimized ? (
        <React.Fragment>
          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </React.Fragment>
      ) : (
        <React.Fragment>
          <path d="M8 3v3a2 2 0 0 1-2 2H3" />
          <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
          <path d="M3 16h3a2 2 0 0 1 2 2v3" />
          <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
        </React.Fragment>
      )}
    </svg>
  )
}
