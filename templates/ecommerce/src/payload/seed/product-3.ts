import type { Product } from '../payload-types'

export const product3: Partial<Product> = {
  slug: 'Online Course',
  _status: 'published',
  enablePaywall: true,
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
            {
              children: [
                {
                  text: 'Purchase this product to gain access to the gated content behind the paywall which will appear below.',
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
    description: 'Make a one-time purchase to gain access to this content',
    image: '{{PRODUCT_IMAGE}}',
    title: 'Online Course',
  },
  paywall: [
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
                  bold: true,
                  text: 'This is paywall content!',
                },
                {
                  text: ' It is only available to admins and users who have purchased this product. This content can be anything from additional video, text, and content, to download links and more. These are simply layout building blocks configured in the CMS.',
                },
              ],
            },
          ],
          size: 'twoThirds',
        },
      ],
    },
  ],
  priceJSON:
    '{"object":"list","data":[{"id":"price_1NWAmeIsIsxtNwz9bt0Du1VT","object":"price","active":true,"billing_scheme":"per_unit","created":1689913060,"currency":"usd","custom_unit_amount":null,"livemode":false,"lookup_key":null,"metadata":{},"nickname":null,"product":"prod_OImLJbmlbfwzM0","recurring":null,"tax_behavior":"unspecified","tiers_mode":null,"transform_quantity":null,"type":"one_time","unit_amount":4999,"unit_amount_decimal":"4999"}],"has_more":false,"url":"/v1/prices"}',
  relatedProducts: [], // this is populated by the seed script
  stripeProductID: '',
  title: 'Online Course',
}
