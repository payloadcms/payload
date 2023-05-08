import { Access } from 'payload/config';

export const publishedOnly: Access = ({ req: { user } }) => {
  if (user) return true;

  return {
    _status: {
      equals: 'published',
    },
  };
};
