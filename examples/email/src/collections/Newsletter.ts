import type { CollectionConfig } from 'payload'

import { generateEmailHTML } from '../email/generateEmailHTML'

export const Newsletter: CollectionConfig = {
  slug: 'newsletter-signups',
  admin: {
    defaultColumns: ['name', 'email'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'email',
      type: 'text',
      required: true,
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create') {
          req.payload
            .sendEmail({
              from: 'sender@example.com',
              html: await generateEmailHTML({
                content: `<p>${doc.name ? `Hi ${doc.name}!` : 'Hi!'} We'll be in touch soon...</p>`,
                headline: 'Welcome to the newsletter!',
              }),
              subject: 'Thanks for signing up!',
              to: doc.email,
            })
            .catch((error) => {
              console.error('Error sending email:', error)
            })
        }
      },
    ],
  },
}
