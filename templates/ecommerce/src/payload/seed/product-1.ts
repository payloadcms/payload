import type { Product } from '../payload-types'

export const product1: Partial<Product> = {
  slug: 'cotton-t',
  _status: 'published',
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              children: [
                {
                  text: "This content is completely dynamic using custom layout building blocks configured in the CMS. This can be anything you'd like from rich text and images, to highly designed, complex components.",
                },
              ],
            },
          ],
          size: 'twoThirds',
        },
      ],
    },
  ],
  meta: {
    description: 'Make a one-time purchase for this physical product.',
    image: '{{PRODUCT_IMAGE}}',
    title: 'Cotton T-Shirt',
  },
  relatedProducts: [], // this is populated by the seed script
  stripeProductID: '',
  title: 'Cotton T-Shirt',
}
