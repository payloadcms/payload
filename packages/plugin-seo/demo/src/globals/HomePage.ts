import { GlobalConfig } from 'payload/types';

const HomePage: GlobalConfig = {
  slug: 'homePage',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true
    },
    {
      name: 'excerpt',
      type: 'text',
    },
  ],
}

export default HomePage;
