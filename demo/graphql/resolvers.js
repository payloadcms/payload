import { mergeResolvers } from 'merge-graphql-schemas';

import Page from '../Page/Page.resolvers';
import Category from '../Category/Category.resolvers';

const resolvers = [
  Page,
  Category
];

export default mergeResolvers(resolvers);
