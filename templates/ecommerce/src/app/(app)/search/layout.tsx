import { Categories } from '@/components/layout/search/Categories'
import { FilterList } from '@/components/layout/search/filter'
import { sorting } from '@/lib/constants'
import { Search } from '@/components/Header/Search'
import React from 'react'

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Fragment>
      <div className="container flex flex-col gap-8 my-16 pb-4 ">
        <Search />
        <div className="w-full flex-none">
          <Categories />
          <FilterList list={sorting} title="Sort by" />
        </div>
        <div className="min-h-screen w-full">{children}</div>
      </div>
    </React.Fragment>
  )
}
