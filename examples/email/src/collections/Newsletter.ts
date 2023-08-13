import type { CollectionConfig } from 'payload/types'
import generateEmailHTML from '../email/generateEmailHTML'

const Newsletter: CollectionConfig = {
  slug: 'newsletter-signups',
  admin: {
    defaultColumns: ['name', 'email'],
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create') {
          req.payload.sendEmail({
            to: doc.email,
            from: 'sender@example.com',
            subject: 'Thanks for signing up!',
            html: await generateEmailHTML({
              headline: 'Welcome to the newsletter!',
              content: `<p>${doc.name ? `Hi ${doc.name}!` : 'Hi!'} We'll be in touch soon...</p>`,
            }),
          })
        }
      },
    ],
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
    }
  ],
}

export default Newsletter
