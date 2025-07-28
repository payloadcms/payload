import type { Product, Variant } from '@/payload-types'

export const productHat: Partial<Product> = {
  enableVariants: true,
  variantTypes: ['{{VARIANT_TYPE_COLOR}}'],
  meta: {
    title: 'Hat | Payload Ecommerce Template',
    image: '{{IMAGE_1}}',
    description:
      'Top off your look with our classic hat, crafted for style and comfort. Made with breathable, high-quality materials and an adjustable strap for the perfect fit.',
  },
  _status: 'published',
  layout: [],
  categories: ['{{CATEGORY_1}}'],
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
  gallery: ['{{IMAGE_1}}', '{{IMAGE_2}}', '{{IMAGE_3}}'],
  title: 'Hat',
  slug: 'hat',
  relatedProducts: ['{{RELATED_PRODUCT_1}}'],
}

export const variantHat: Partial<Variant> = {
  product: '{{PRODUCT}}',
  options: ['{{VARIANT_OPTION}}'],
  inventory: 365,
  priceInUSDEnabled: true,
  priceInUSD: 2500,
  _status: 'published',
}
