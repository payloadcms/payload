import React from 'react';
import md5 from 'md5';
import qs from 'qs';
import { useAuth } from '../../utilities/Auth';

const Gravatar: React.FC = () => {
  const { user } = useAuth();

  const hash = md5(user.email.trim().toLowerCase());

  const query = qs.stringify({
    s: 50,
    r: 'g',
    default: 'mp',
  });

  return (
    <img
      className="gravatar-account"
      style={{ borderRadius: '50%' }}
      src={`https://www.gravatar.com/avatar/${hash}?${query}`}
      alt="yas"
      width={25}
      height={25}
    />
  );
};

export default Gravatar;
