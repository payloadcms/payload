import type { Product } from '@/payload-types'

export const productHoodie: Partial<Product> = {
  enableVariants: true,
  variantOptions: [
    {
      label: 'Size',
      slug: 'size',
      options: [
        {
          label: 'Small',
          slug: 'small',
          group: 'size',
        },
        {
          label: 'Medium',
          slug: 'medium',
          group: 'size',
        },
        {
          label: 'Large',
          slug: 'large',
          group: 'size',
        },
        {
          label: 'X Large',
          slug: 'x-large',
          group: 'size',
        },
      ],
    },
  ],
  variants: [
    {
      active: true,
      options: [
        {
          value: 'small',
          slug: 'size',
        },
      ],
      price: 2122,
      stock: 423,
    },
    {
      active: true,
      options: [
        {
          value: 'medium',
          slug: 'size',
        },
      ],
      price: 1299,
      stock: 889,
    },
    {
      active: true,
      options: [
        {
          value: 'large',
          slug: 'size',
        },
      ],
      price: 1999,
      stock: 13,
    },
    {
      active: true,
      options: [
        {
          value: 'x-large',
          slug: 'size',
        },
      ],
      price: 0,
      stock: 23,
    },
  ],
  stock: 0,
  meta: {
    title: 'Hoodie | Payload Ecommerce Template',
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
  gallery: ['{{IMAGE_1}}', '{{IMAGE_2}}', '{{IMAGE_3}}'],
  price: 1999,
  publishedOn: '2025-01-21T00:01:06.661Z',
  title: 'Hoodie',
  slug: 'hoodie',
  relatedProducts: ['{{RELATED_PRODUCT_1}}'],
}
