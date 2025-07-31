import type { Category, Product, VariantOption, VariantType } from '@/payload-types'
import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

type ProductArgs = {
  galleryImages: Media[]
  metaImage: Media
  variantTypes: VariantType[]
  categories: Category[]
  relatedProducts: Product[]
}

export const productHatData: (args: ProductArgs) => RequiredDataFromCollectionSlug<'products'> = ({
  galleryImages,
  relatedProducts,
  metaImage,
  variantTypes,
  categories,
}) => {
  return {
    enableVariants: true,
    variantTypes: variantTypes,
    meta: {
      title: 'Hat | Payload Ecommerce Template',
      image: metaImage,
      description:
        'Top off your look with our classic hat, crafted for style and comfort. Made with breathable, high-quality materials and an adjustable strap for the perfect fit.',
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
    title: 'Hat',
    slug: 'hat',
    priceInUSDEnabled: true,
    priceInUSD: 2500,
    relatedProducts: relatedProducts,
  }
}

type ProductVariantArgs = {
  product: Product
  variantOptions: VariantOption[]
}

export const productHatVariant: (
  args: ProductVariantArgs,
) => RequiredDataFromCollectionSlug<'variants'> = ({ product, variantOptions }) => {
  return {
    product: product,
    options: variantOptions,
    inventory: 365,
    priceInUSDEnabled: true,
    priceInUSD: 2500,
    _status: 'published',
  }
}
