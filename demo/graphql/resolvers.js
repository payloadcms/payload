import { mergeResolvers } from 'merge-graphql-schemas';

import Page from '../Page/Page.resolvers';

const resolvers = [Page];

export default mergeResolvers(resolvers);
