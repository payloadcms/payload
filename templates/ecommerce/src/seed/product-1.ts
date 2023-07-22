import type { Product } from '../payload-types'

export const product1: Partial<Product> = {
  title: 'Cotton T-Shirt',
  stripeProductID: 'prod_NGzfjFJYMHIpN4',
  slug: 'cotton-t',
  _status: 'published',
  layout: [
    {
      blockType: 'content',
      backgroundColor: 'white',
      columns: [
        {
          size: 'twoThirds',
          richText: [
            {
              children: [
                {
                  text: "All content from this point is completely dynamic using custom layout building block configured in the CMS. This can be anything you'd like.",
                },
              ],
            },
          ],
          link: {
            reference: {
              relationTo: 'pages',
              value: '',
            },
            url: '',
            label: '',
          },
        },
      ],
    },
  ],
  meta: {
    title: 'Cotton T-Shirt',
    description: 'One-time purchase for a product or service',
    image: '{{PRODUCT_IMAGE}}',
  },
}
