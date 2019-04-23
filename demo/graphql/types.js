import { mergeTypes } from 'merge-graphql-schemas';

import Page from '../Page/Page.types';

const types = [Page];

export default mergeTypes(types, { all: true });
