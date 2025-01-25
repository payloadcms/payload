import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { OpenCart } from '@/components/Cart/OpenCart'
import { LogoSquare } from '@/components/LogoSquare'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { MobileMenu } from './mobile-menu'
import { Search, SearchSkeleton } from './search'
const { SITE_NAME } = process.env
import type { Header } from 'src/payload-types'

import AccountDrawer from '@/components/AccountDrawer'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function Header() {
  const header: Header = await getCachedGlobal('header', 1)()
  const menu = header.navItems || []

  return (
    <nav className="relative z-20 flex items-center justify-between p-4 lg:px-6">
      <div className="block flex-none md:hidden">
        <Suspense fallback={null}>
          <MobileMenu menu={menu} />
        </Suspense>
      </div>
      <div className="flex w-full items-center">
        <div className="flex w-full md:w-1/3">
          <Link className="mr-2 flex w-full items-center justify-center md:w-auto lg:mr-6" href="/">
            <LogoSquare />
            <div className="ml-2 flex-none text-sm font-medium uppercase md:hidden lg:block">
              {SITE_NAME}
            </div>
          </Link>
          {menu.length ? (
            <ul className="hidden gap-6 text-sm md:flex md:items-center">
              {menu.map((item) => (
                <li key={item.id}>
                  <CMSLink {...item.link} appearance="link" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="hidden justify-center md:flex md:w-1/3">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
        </div>
        <div className="flex justify-end md:w-1/3 gap-4">
          <Suspense fallback={<OpenCart />}>
            <AccountDrawer />
          </Suspense>
          <Suspense fallback={<OpenCart />}>
            <Cart />
          </Suspense>
        </div>
      </div>
    </nav>
  )
}
