import type { Category, Media, Product, VariantOption, VariantType } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

type ProductArgs = {
  galleryImages: NonNullable<Product['gallery']>
  metaImage: Media
  variantTypes: VariantType[]
  categories: Category[]
  relatedProducts: Product[]
}

export const productTshirtData: (
  args: ProductArgs,
) => RequiredDataFromCollectionSlug<'products'> = ({
  galleryImages,
  relatedProducts,
  metaImage,
  variantTypes,
  categories,
}) => {
  return {
    enableVariants: true,
    variantTypes: variantTypes,
    inventory: 0,
    meta: {
      title: 'Tshirt | Payload Ecommerce Template',
      image: metaImage,
      description:
        'Top off your look with our classic Tshirt, crafted for style and comfort. Made with breathable, high-quality materials and an adjustable strap for the perfect fit.',
    },
    _status: 'published',
    layout: [],
    categories: categories,
    description: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Top off your look with our classic hat, crafted for style and comfort. Made with breathable, high-quality materials and an adjustable strap for the perfect fit, it’s ideal for everyday wear or outdoor adventures. Available in a range of colors to match any outfit.',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: 0,
            textStyle: '',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    },
    gallery: galleryImages,
    title: 'Tshirt',
    slug: 'tshirt',
    priceInUSDEnabled: true,
    priceInUSD: 4999,
    relatedProducts: relatedProducts,
  }
}

type ProductVariantArgs = {
  product: Product
  variantOptions: VariantOption[]
  inventory?: number
  priceInUSD?: number
}

export const productTshirtVariant: (
  args: ProductVariantArgs,
) => RequiredDataFromCollectionSlug<'variants'> = ({
  product,
  variantOptions,
  inventory = 492,
  priceInUSD = 4999,
}) => {
  return {
    product: product,
    options: variantOptions,
    inventory,
    priceInUSDEnabled: true,
    priceInUSD,
    _status: 'published',
  }
}
