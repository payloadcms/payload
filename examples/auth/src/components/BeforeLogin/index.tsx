import React from 'react'

export const BeforeLogin: React.FC = () => {
  if (process.env.PAYLOAD_PUBLIC_SEED === 'true') {
    return (
      <p>
        {'Log in with the email '}
        <strong>demo@payloadcms.com</strong>
        {' and the password '}
        <strong>demo</strong>.
      </p>
    )
  }
  return null
}
