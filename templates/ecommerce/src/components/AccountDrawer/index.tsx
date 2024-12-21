'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/providers/Auth'
import { UserIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

export default function AccountDrawer() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger className="relative hidden md:flex  h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:bg-black dark:text-white">
        <UserIcon className="h-4 transition-all ease-in-out hover:scale-110" />
      </SheetTrigger>

      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>My account</SheetTitle>

          <SheetDescription>
            You are currently shopping as a guest. Log in or create an account for an easier
            checkout process.
          </SheetDescription>
        </SheetHeader>
        <hr className="my-5" />
        {user ? (
          <div className="">
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/orders">Orders</Link>
              </li>
              <li>
                <Link href="/account">Manage account</Link>
              </li>
              <li className="mt-6">
                <Button asChild variant="outline">
                  <Link href="/logout">Log out</Link>
                </Button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="flex flex-col flex-grow justify-between gap-2">
            <nav aria-label="My account navigation">
              <Link href="/order-lookup">Order Look-up</Link>
            </nav>

            <div className="flex-grow"></div>

            <div className="flex flex-col gap-2">
              <Button asChild className="w-full" variant="default">
                <Link
                  href={pathname.includes('product') ? `/login?redirect=${pathname}` : '/login'}
                >
                  Log in
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link
                  href={
                    pathname.includes('product')
                      ? `/create-account?redirect=${pathname}`
                      : '/create-account'
                  }
                >
                  Create an account
                </Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
