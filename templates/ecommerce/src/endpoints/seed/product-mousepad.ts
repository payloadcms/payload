import type { Category, Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

type ProductArgs = {
  galleryImages: Media[]
  metaImage: Media
  categories: Category[]
}

export const productMousepadData: (
  args: ProductArgs,
) => RequiredDataFromCollectionSlug<'products'> = ({ galleryImages, metaImage, categories }) => {
  return {
    inventory: 64,
    priceInUSDEnabled: true,
    priceInUSD: 1999,
    meta: {
      title: 'Mouse pad | Payload Ecommerce Template',
      image: metaImage,
      description:
        'Upgrade your workspace with our premium mousepad, designed for precision and comfort. Made with the best materials on the market.',
    },
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
    gallery: galleryImages,
    categories: categories,
    slug: 'mouse-pad',
    title: 'Mouse pad',
  }
}
