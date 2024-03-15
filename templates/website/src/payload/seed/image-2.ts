import type { Media } from '../payload-types'

export const image2: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
  alt: 'E-Book',
  caption: [
    {
      children: [
        {
          text: 'Photo by ',
        },
        {
          type: 'link',
          children: [
            {
              text: 'Sebastian Svenson',
            },
          ],
          linkType: 'custom',
          newTab: true,
          url: 'https://unsplash.com/@sebastiansvenson?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText',
        },
        {
          text: ' on ',
        },
        {
          type: 'link',
          children: [
            {
              text: 'Unsplash',
            },
          ],
          linkType: 'custom',
          newTab: true,
          url: 'https://unsplash.com/photos/d2w-_1LJioQ?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText',
        },
        {
          text: '.',
        },
      ],
    },
  ],
}
