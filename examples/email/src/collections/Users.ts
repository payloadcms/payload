import type { CollectionConfig } from 'payload/types'

import generateForgotPasswordEmail from '../email/generateForgotPasswordEmail'
import generateVerificationEmail from '../email/generateVerificationEmail'

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    verify: {
      generateEmailSubject: () => 'Verify your email',
      generateEmailHTML: generateVerificationEmail,
    },
    forgotPassword: {
      generateEmailSubject: () => 'Reset your password',
      generateEmailHTML: generateForgotPasswordEmail,
    },
  },
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}

export default Users
