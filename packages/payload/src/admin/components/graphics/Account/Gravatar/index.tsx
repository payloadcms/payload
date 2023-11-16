import md5 from 'md5'
import qs from 'qs'
import React from 'react'

import { useAuth } from '../../../utilities/Auth'

const Gravatar: React.FC = () => {
  const { user } = useAuth()

  const hash = md5(user.email.trim().toLowerCase())

  const query = qs.stringify({
    default: 'mp',
    r: 'g',
    s: 50,
  })

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

export default Gravatar
