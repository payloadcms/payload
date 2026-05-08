import React from 'react'
type UrlObject = {
  hash?: string
  pathname?: string
  query?: Record<string, string>
  search?: string
}

type NextLinkProps = {
  [key: string]: unknown
  children?: React.ReactNode
  className?: string
  href: string | UrlObject
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  prefetch?: boolean
  rel?: string
  replace?: boolean
  scroll?: boolean
  target?: string
}

export type { NextLinkProps as LinkProps }

const NextLink = ({
  children,
  href,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  ...props
}: NextLinkProps) => {
  const hrefStr = typeof href === 'string' ? href : (href?.pathname ?? '#')
  return (
    <a href={hrefStr} {...props}>
      {children}
    </a>
  )
}

// eslint-disable-next-line no-restricted-exports -- mock for next/link which requires a default export
export default NextLink
