import type { Product } from '../payload-types'

export const product3: Partial<Product> = {
  title: 'Online Course',
  stripeProductID: 'prod_NGzgr62LTu1M6T',
  slug: 'Online Course',
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
            {
              children: [
                {
                  text: 'Purchase this product to gain access to the gated content behind the paywall which will appear below.',
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
  paywall: [
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
                  text: 'This is paywall content!',
                  bold: true,
                },
                {
                  text: ' This can be anything from additional content and videos to download links and more. It is only available to users who have purchased this product. If you are seeing this, you have purchased this product.',
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
    title: 'Online Course',
    description: 'One-time purchase for gated content',
    image: '{{PRODUCT_IMAGE}}',
  },
}
