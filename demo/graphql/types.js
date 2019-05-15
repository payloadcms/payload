import { mergeTypes } from 'merge-graphql-schemas';

import Page from '../Page/Page.types';
import Category from '../Category/Category.types';
const types = [
  Page,
  Category
];

export default mergeTypes(types, { all: true });
