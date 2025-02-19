import type { Product } from '@/payload-types'

export const productMousepad: Partial<Product> = {
  variants: {
    options: [],
    variants: [],
  },
  stock: 64,
  meta: {
    title: 'Mouse pad | Payload Ecommerce Template',
    image: '{{IMAGE_1}}',
    description:
      'Upgrade your workspace with our premium mousepad, designed for precision and comfort. Made with the best materials on the market.',
  },
  skipSync: false,
  _status: 'published',
  layout: [],
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
              text: "Upgrade your workspace with our premium mousepad, designed for precision and comfort. Featuring a smooth, durable surface for effortless mouse movement and a non-slip rubber base for stability, it's perfect for work, gaming, or everyday use. Easy to clean and available in various sizes and stylish designs to suit your needs.",
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
  categories: ['{{CATEGORY_1}}'],
  price: 2999,
  title: 'Mouse pad',
}
