'use client'
import md5 from 'md5'
import React from 'react'

import { useAuth } from '../../../providers/Auth/index.js'

export const GravatarAccountIcon: React.FC = () => {
  const { user } = useAuth()

  const hash = md5(user.email.trim().toLowerCase())

  const params = new URLSearchParams({
    default: 'mp',
    r: 'g',
    s: '50',
  }).toString()

  const query = `?${params}`

  return (
    <img
      alt="yas"
      className="gravatar-account"
      height={25}
      src={`https://www.gravatar.com/avatar/${hash}?${query}`}
      style={{ borderRadius: '50%' }}
      width={25}
    />
  )
}
