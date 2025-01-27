import type { Media } from '../payload-types'

export const image2: Omit<Media, 'id' | 'createdAt' | 'updatedAt'> = {
  alt: 'E-Book',
  caption: [
    {
      children: [
        {
          text: 'Photo by ',
        },
        {
          type: 'link',
          linkType: 'custom',
          url: 'https://unsplash.com/@sebastiansvenson?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText',
          newTab: true,
          children: [
            {
              text: 'Sebastian Svenson',
            },
          ],
        },
        {
          text: ' on ',
        },
        {
          type: 'link',
          linkType: 'custom',
          url: 'https://unsplash.com/photos/d2w-_1LJioQ?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText',
          newTab: true,
          children: [
            {
              text: 'Unsplash',
            },
          ],
        },
        {
          text: '.',
        },
      ],
    },
  ],
}
