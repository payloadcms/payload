// Mock Next.js Link component for Storybook
import React from 'react'

const Link = ({ 
  children, 
  href, 
  onClick, 
  prefetch,
  replace,
  scroll,
  shallow,
  ...props 
}) => {
  return (
    <a
      href={typeof href === 'string' ? href : (href?.pathname || '#mock-link')}
      onClick={(e) => {
        e.preventDefault()
        if (onClick) onClick(e)
      }}
      {...props}
    >
      {children}
    </a>
  )
}

// Support both default and named exports
export default Link
export { Link }