import React from 'react'

const BeforeLogin: React.FC = () => {
  if (process.env.PAYLOAD_PUBLIC_SEED === 'true') {
    return (
      <div>
        <h3>Draft Preview Example</h3>
        <p>
          {'Log in with the email '}
          <strong>demo@payloadcms.com</strong>
          {' and the password '}
          <strong>demo</strong>.
        </p>
      </div>
    )
  }
  return null
}

export default BeforeLogin
