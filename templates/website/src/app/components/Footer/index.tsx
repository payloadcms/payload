import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '../../../payload-types'

/* import { fetchFooter } from '../../_api/fetchGlobals' */
import { ThemeSelector } from '../../providers/Theme/ThemeSelector'
import { Gutter } from '../Gutter'
import { CMSLink } from '../Link'

export async function Footer() {
  let footer: Footer | null = null

  try {
    footer = await getCachedGlobal('footer')()
  } catch (error) {
    // When deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // So swallow the error here and simply render the footer without nav items if one occurs
    // in production you may want to redirect to a 404  page or at least log the error somewhere
    // console.error(error)
  }

  const navItems = footer?.navItems || []

  return (
    <footer className="border-t border-border ">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <nav className="flex flex-col gap-4">
          {navItems.map(({ link }, i) => {
            return <CMSLink key={i} {...link} />
          })}
        </nav>

        <div className="flex flex-col gap-4">
          <Link href="/">
            <picture>
              <img
                alt="Payload Logo"
                className="max-w-[12rem] invert dark:invert-0"
                src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/payload/src/admin/assets/images/payload-logo-light.svg"
              />
            </picture>
          </Link>
          <ThemeSelector />
        </div>
      </div>
    </footer>
  )
}
