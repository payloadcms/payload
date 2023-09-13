import payload from 'payload'

import type { InitialMedia } from './media'

export const seedGlobals = async (media: InitialMedia): Promise<void> => {
  await payload.updateGlobal({
    slug: 'profile',
    data: {
      name: 'Samantha Smith',
      location: 'Portland, OR',
      title: 'UI/UX Designer',
      profileImage: media.profileImage.id,
      socialLinks: {
        github: 'https://github.com/payloadcms',
        linkedin: 'https://www.linkedin.com/company/payload-cms/',
        twitter: 'https://twitter.com/payloadcms',
        email: 'info@payloadcms.com',
      },
      aboutMe: [
        {
          text: "Samantha Smith is a visionary artist with a passion for pushing boundaries. She crafts captivating visual stories that leave a lasting impact. Her work reflects a perfect blend of innovation and elegance, whether in logo designs that capture a brand's essence or breathtaking illustrations that transport you to distant realms.",
        },
      ],
      _status: 'published',
    },
  })

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: [
        {
          link: {
            type: 'custom',
            newTab: true,
            url: 'https://www.linkedin.com/company/payload-cms/',
            label: 'LinkedIn',
          },
        },
        {
          link: {
            type: 'custom',
            newTab: true,
            url: 'https://dribbble.com',
            label: 'Dribbble',
          },
        },
        {
          link: {
            type: 'custom',
            newTab: true,
            url: 'https://instagram.com',
            label: 'Instagram',
          },
        },
      ],
    },
  })
}
