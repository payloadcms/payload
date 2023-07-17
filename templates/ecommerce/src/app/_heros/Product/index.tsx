import React, { Fragment } from 'react'

import { Product } from '../../../payload/payload-types'
import { AddToCartButton } from '../../_components/AddToCartButton'
import { Gutter } from '../../_components/Gutter'
import { Media } from '../../_components/Media'
import { Price } from '../../_components/Price'
import RichText from '../../_components/RichText'

import classes from './index.module.scss'

export const ProductHero: React.FC<{
  product: Product
}> = ({ product }) => {
  const { title, categories, meta: { image: metaImage, description } = {} } = product

  return (
    <Gutter className={classes.productHero}>
      <div className={classes.content}>
        <div className={classes.categories}>
          {categories?.map((category, index) => {
            const { title: categoryTitle } = category

            const titleToUse = categoryTitle || 'Untitled category'

            const isLast = index === categories.length - 1

            return (
              <Fragment key={index}>
                {titleToUse}
                {!isLast && <Fragment>, &nbsp;</Fragment>}
              </Fragment>
            )
          })}
        </div>
        <h1 className={classes.title}>{title}</h1>
        {description && <p className={classes.description}>{description}</p>}
        <Price product={product} button={false} />
        <AddToCartButton product={product} className={classes.addToCartButton} />
      </div>
      <div className={classes.media}>
        <div className={classes.mediaWrapper}>
          {!metaImage && <div className={classes.placeholder}>No image</div>}
          {metaImage && typeof metaImage !== 'string' && (
            <Media imgClassName={classes.image} resource={metaImage} fill />
          )}
        </div>
        {metaImage && typeof metaImage !== 'string' && metaImage?.caption && (
          <RichText content={metaImage.caption} className={classes.caption} />
        )}
      </div>
    </Gutter>
  )
}
