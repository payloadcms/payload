import payload from 'payload'

import type { InitialForms } from './forms'
import type { InitialProjects } from './projects'

export const seedPages = async (forms: InitialForms, projects: InitialProjects): Promise<void> => {
  await payload.create({
    collection: 'pages',
    data: {
      title: 'Profile Landing Page',
      slug: 'home',
      layout: [
        {
          blockType: 'profile-cta',
        },
        {
          project: Object.values(projects).map(project => project.id),
          blockType: 'projectGrid',
        },
        {
          richText: [
            {
              children: [
                {
                  text: 'Contact',
                },
              ],
              type: 'h2',
            },
            {
              children: [
                {
                  text: 'For commissions and other inquiries, please use the form below.',
                },
              ],
            },
          ],
          form: forms.contactForm.id,
          blockType: 'form',
        },
      ],
      _status: 'published',
    },
  })
}
