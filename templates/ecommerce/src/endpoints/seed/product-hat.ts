import type { Product } from '@/payload-types'

export const productHat: Partial<Product> = {
  variantOptions: [
    {
      label: 'Color',
      slug: 'color',
      options: [
        {
          label: 'Black',
          slug: 'black',
          group: 'color',
        },
        {
          label: 'White',
          slug: 'white',
          group: 'color',
        },
      ],
    },
  ],
  variants: [
    {
      active: true,
      options: [
        {
          value: 'black',
          slug: 'color',
        },
      ],
      price: 2122,
      stock: 423,
    },
    {
      active: true,
      options: [
        {
          value: 'white',
          slug: 'color',
        },
      ],
      price: 1299,
      stock: 889,
    },
  ],
  stock: 0,
  meta: {
    title: 'Hat | Payload Ecommerce Template',
    image: '{{IMAGE_1}}',
    description:
      'Top off your look with our classic hat, crafted for style and comfort. Made with breathable, high-quality materials and an adjustable strap for the perfect fit.',
  },
  skipSync: false,
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
  enableVariants: true,
  gallery: ['{{IMAGE_1}}', '{{IMAGE_2}}', '{{IMAGE_3}}'],
  price: 1999,
  publishedOn: '2025-01-21T00:01:06.661Z',
  title: 'Hat',
  slug: 'hat',
  relatedProducts: ['{{RELATED_PRODUCT_1}}'],
}
