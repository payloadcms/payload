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

      <SheetContent>
        <SheetHeader>
          <SheetTitle>My account</SheetTitle>

          <SheetDescription>Manage your account details and view your orders.</SheetDescription>
        </SheetHeader>
        {user ? (
          <div className="mt-4">
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
          <div className="flex items-center gap-2 mt-12">
            <Button asChild className="w-full" variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
            <span>or</span>
            <Button asChild className="w-full">
              <Link href="/create-account">Create an account</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
