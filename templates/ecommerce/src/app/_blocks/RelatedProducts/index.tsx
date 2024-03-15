import React from 'react'

import type { Product } from '../../../payload/payload-types'

import { Card } from '../../_components/Card'
import { Gutter } from '../../_components/Gutter'
import RichText from '../../_components/RichText'
import classes from './index.module.scss'

export type RelatedProductsProps = {
  blockName: string
  blockType: 'relatedProducts'
  docs?: (Product | string)[]
  introContent?: any
  relationTo: 'products'
}

export const RelatedProducts: React.FC<RelatedProductsProps> = (props) => {
  const { docs, introContent, relationTo } = props

  return (
    <div className={classes.relatedProducts}>
      {introContent && (
        <Gutter className={classes.introContent}>
          <RichText content={introContent} />
        </Gutter>
      )}
      <Gutter>
        <div className={classes.grid}>
          {docs?.map((doc, index) => {
            if (typeof doc === 'string') return null

            return (
              <div
                className={[
                  classes.column,
                  docs.length === 2 && classes['cols-half'],
                  docs.length >= 3 && classes['cols-thirds'],
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={index}
              >
                <Card doc={doc} relationTo={relationTo} showCategories />
              </div>
            )
          })}
        </div>
      </Gutter>
    </div>
  )
}
