'use client'

import Link from 'next/link'

import { CMSLink } from 'src/components/Link'
import { Logo } from 'src/components/Logo'
import { ThemeSelector } from 'src/components/ThemeSelector'
import type { Footer as FooterType } from 'src/payload-types'

interface FooterClientProps {
  data: FooterType
}

export function FooterClient({ data }: FooterClientProps) {
  const navItems = data?.navItems || []

  return (
    <footer className="mt-auto border-t border-border bg-black text-white dark:bg-card">
      <div className="container flex flex-col gap-8 py-8 md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        <div className="flex flex-col-reverse items-start gap-4 md:flex-row md:items-center">
          <ThemeSelector />
          {navItems.length > 0 && (
            <nav className="flex flex-col gap-4 md:flex-row">
              {navItems.map(({ link }, i) => {
                return <CMSLink className="text-white" key={i} {...link} />
              })}
            </nav>
          )}
        </div>
      </div>
    </footer>
  )
}
