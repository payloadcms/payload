import configPromise from '@payload-config'
import { getPayload } from 'payload'
import clsx from 'clsx'
import React, { Suspense } from 'react'

import { Item } from './Item'

async function List() {
  const payload = await getPayload({ config: configPromise })
  const categoriesData = await payload.find({
    collection: 'categories',
    sort: 'title',
    select: {
      title: true,
      slug: true,
    },
  })

  const categories = categoriesData.docs?.map((category) => {
    return {
      href: `/shop/${category.slug}`,
      title: category.title,
    }
  })

  return (
    <React.Fragment>
      <nav>
        <ul className="flex gap-3">
          <Item title="All" href="/shop" />
          <Suspense fallback={null}>
            {categories.map((category) => {
              return <Item {...category} key={category.href} />
            })}
          </Suspense>
        </ul>
      </nav>
    </React.Fragment>
  )
}

const skeleton = 'mb-3 h-4 w-5/6 animate-pulse rounded'
const activeAndTitles = 'bg-neutral-800 dark:bg-neutral-300'
const items = 'bg-neutral-400 dark:bg-neutral-700'

export function CategoryTabs() {
  return (
    <Suspense
      fallback={
        <div className="col-span-2 hidden h-[400px] w-full flex-none py-4 lg:block">
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
        </div>
      }
    >
      <List />
    </Suspense>
  )
}
