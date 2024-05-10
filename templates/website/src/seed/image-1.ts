// @ts-nocheck
import type { Media } from '../payload-types'

export const image1: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
  alt: 'Shirts',
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
              text: 'Voicu Apostol',
            },
          ],
          linkType: 'custom',
          newTab: true,
          url: 'https://unsplash.com/@cerpow?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText',
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
          url: 'https://unsplash.com/photos/a-close-up-of-a-pine-tree-branch-Cy1F3H1X3WI?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText',
        },
        {
          text: '.',
        },
      ],
    },
  ],
}
