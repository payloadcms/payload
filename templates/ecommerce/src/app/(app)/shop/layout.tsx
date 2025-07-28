import { CategoryTabs } from '@/components/CategoryTabs'

import React from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Fragment>
      <div className="container flex flex-col gap-8 my-16 pb-4">
        <div className="">
          <CategoryTabs />
        </div>
        <div className="min-h-screen w-full">{children}</div>
      </div>
    </React.Fragment>
  )
}
