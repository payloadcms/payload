import { AnchorHTMLAttributes, ReactNode } from 'react'
import Link, { LinkProps } from 'next/link'

import { Header } from '../../../payload-types'

export type PayloadLinkType = Header['navItems'][0]['link']

export const PayloadLink = ({
  link,
  children,
  className,
}: {
  link: PayloadLinkType
  children?: ReactNode
  className?: string
}) => {
  let props: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> = {
    href: '/',
  }

  if (link.newTab) {
    props.target = '_blank'
  }

  if (link.type === 'reference') {
    const { reference } = link
    const prefix = reference.relationTo === 'pages' ? '/' : `/${reference.relationTo}/`
    const suffix = (reference.value as { slug: string }).slug
    props.href = `${prefix}${suffix}`
  } else {
    props.href = link.url
  }

  return (
    <Link {...props} className={className}>
      {children || link.label}
    </Link>
  )
}
