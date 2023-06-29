import * as React from 'react'
import Link from 'next/link'

import { Gutter } from '../Gutter'

import classes from './index.module.scss'

export type Breadcrumb = {
  label?: string
  url?: string
}

export type Props = {
  items?: Array<Breadcrumb>
}

export const Breadcrumbs: React.FC<Props> = ({ items }) => {
  return (
    <Gutter className={classes.breadcrumbs}>
      {items?.map((item, index) => {
        const isLast = index === items.length - 1

        if (item?.url && typeof item.url === 'string' && !isLast) {
          return (
            <React.Fragment key={index}>
              <label className={classes.label}>
                <Link href={item.url} prefetch={false}>
                  {item.label}
                </Link>
              </label>
              {!isLast && (
                <label className={classes.label}>
                  <span>&nbsp;&#47;&nbsp;</span>
                </label>
              )}
            </React.Fragment>
          )
        }

        return (
          <label key={index} className={classes.label}>
            {item.label}
            {!isLast && <span>&nbsp;/&nbsp;</span>}
          </label>
        )
      })}
    </Gutter>
  )
}
