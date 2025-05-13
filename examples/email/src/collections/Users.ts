import type { CollectionConfig } from 'payload'

import { generateForgotPasswordEmail } from '../email/generateForgotPasswordEmail'
import { generateVerificationEmail } from '../email/generateVerificationEmail'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: generateForgotPasswordEmail,
      generateEmailSubject: () => 'Reset your password',
    },
    verify: {
      generateEmailHTML: generateVerificationEmail,
      generateEmailSubject: () => 'Verify your email',
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}
